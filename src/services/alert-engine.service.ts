import { prisma } from '@/lib/prisma';
import { computeDynamicScore } from './scoring.service';
import { fetchWaterLevelByStation } from './water.service';
import type { AlertEvaluationResult, AlertRunSummary } from '@/types/alert';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

/**
 * Fetch forecast weather from Open-Meteo for a given location.
 * Returns the first hourly entry with pressure, windSpeed, cloudCover, temperature.
 */
async function fetchForecastWeather(
  lat: number,
  lon: number,
): Promise<{ pressure: number; windSpeed: number; cloudCover: number; temperature: number } | null> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      hourly: 'temperature_2m,pressure_msl,windspeed_10m,cloudcover,precipitation',
      forecast_days: '2',
      timezone: 'Europe/Paris',
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.hourly || !data.hourly.time || data.hourly.time.length === 0) return null;

    // Find the current or next hour entry
    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = now.toISOString().split('T')[0];
    const targetTimeStr = `${todayStr}T${String(currentHour).padStart(2, '0')}:00`;

    let idx = data.hourly.time.indexOf(targetTimeStr);
    if (idx === -1) idx = 0;

    return {
      pressure: data.hourly.pressure_msl[idx] ?? 1013,
      windSpeed: data.hourly.windspeed_10m[idx] ?? 10,
      cloudCover: data.hourly.cloudcover[idx] ?? 50,
      temperature: data.hourly.temperature_2m[idx] ?? 15,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a subscription was triggered within the last 24 hours.
 */
function wasTriggeredRecently(lastTriggered: Date | null): boolean {
  if (!lastTriggered) return false;
  return Date.now() - lastTriggered.getTime() < TWENTY_FOUR_HOURS;
}

/**
 * Evaluate ideal conditions for a user's favorite spots.
 */
export async function evaluateIdealConditions(userId: string): Promise<AlertEvaluationResult[]> {
  const results: AlertEvaluationResult[] = [];

  // Get user's active IDEAL_CONDITIONS subscriptions
  const subscriptions = await prisma.alertSubscription.findMany({
    where: {
      userId,
      type: 'IDEAL_CONDITIONS',
      isActive: true,
    },
  });

  if (subscriptions.length === 0) return results;

  // Get user's favorite spots
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      spot: {
        select: {
          id: true,
          name: true,
          slug: true,
          latitude: true,
          longitude: true,
          hydroStationCode: true,
          tempStationCode: true,
        },
      },
    },
  });

  if (favorites.length === 0) return results;

  for (const sub of subscriptions) {
    if (wasTriggeredRecently(sub.lastTriggered)) continue;

    const threshold = (sub.config as Record<string, unknown>)?.threshold as number ?? 75;

    // Filter spots: if subscription has a spotId, use only that spot
    const relevantFavorites = sub.spotId
      ? favorites.filter((f) => f.spotId === sub.spotId)
      : favorites;

    for (const fav of relevantFavorites) {
      const spot = fav.spot;

      try {
        // Fetch forecast weather
        const weatherData = await fetchForecastWeather(spot.latitude, spot.longitude);
        if (!weatherData) continue;

        // Compute dynamic score
        const score = await computeDynamicScore(
          spot.id,
          spot.latitude,
          spot.longitude,
          weatherData,
        );

        if (score > threshold) {
          // Create notification
          await prisma.notification.create({
            data: {
              type: 'IDEAL_CONDITIONS',
              title: `Conditions ideales sur ${spot.name}`,
              body: `Le score de pechabilite atteint ${score}/100 sur ${spot.name}. C'est le moment d'y aller !`,
              data: { spotId: spot.id, spotSlug: spot.slug, score },
              userId,
            },
          });

          // Update lastTriggered
          await prisma.alertSubscription.update({
            where: { id: sub.id },
            data: { lastTriggered: new Date() },
          });

          results.push({
            type: 'IDEAL_CONDITIONS',
            spotId: spot.id,
            spotName: spot.name,
            title: `Conditions ideales sur ${spot.name}`,
            body: `Score: ${score}/100`,
            score,
          });

          // Only trigger once per subscription per run
          break;
        }
      } catch (error) {
        console.error(`Ideal conditions evaluation failed for spot ${spot.id}:`, error);
      }
    }
  }

  return results;
}

/**
 * Evaluate water level alerts for a user's subscribed spots.
 */
export async function evaluateWaterLevelAlerts(userId: string): Promise<AlertEvaluationResult[]> {
  const results: AlertEvaluationResult[] = [];

  const subscriptions = await prisma.alertSubscription.findMany({
    where: {
      userId,
      type: 'WATER_LEVEL_ABNORMAL',
      isActive: true,
    },
    include: {
      spot: {
        select: {
          id: true,
          name: true,
          slug: true,
          hydroStationCode: true,
        },
      },
    },
  });

  if (subscriptions.length === 0) return results;

  for (const sub of subscriptions) {
    if (wasTriggeredRecently(sub.lastTriggered)) continue;
    if (!sub.spot?.hydroStationCode) continue;

    try {
      const waterData = await fetchWaterLevelByStation(sub.spot.hydroStationCode);
      if (!waterData) continue;

      // Check for abnormal water levels
      const isAbnormal =
        waterData.currentLevel > 5.0 || // High water level (flood risk)
        waterData.currentLevel < 0.1 || // Very low water level
        waterData.trend === 'rising' && waterData.currentLevel > 3.0; // Rising and already high

      if (isAbnormal) {
        const levelDescription = waterData.currentLevel > 5.0
          ? 'Niveau d\'eau tres eleve (risque de crue)'
          : waterData.currentLevel < 0.1
            ? 'Niveau d\'eau tres bas (etiage)'
            : 'Niveau d\'eau en hausse rapide';

        await prisma.notification.create({
          data: {
            type: 'WATER_LEVEL_ALERT',
            title: `Alerte niveau d'eau - ${sub.spot.name}`,
            body: `${levelDescription}. Niveau actuel: ${waterData.currentLevel}${waterData.unit}. Tendance: ${waterData.trend === 'rising' ? 'en hausse' : waterData.trend === 'falling' ? 'en baisse' : 'stable'}.`,
            data: {
              spotId: sub.spot.id,
              spotSlug: sub.spot.slug,
              currentLevel: waterData.currentLevel,
              trend: waterData.trend,
            },
            userId,
          },
        });

        await prisma.alertSubscription.update({
          where: { id: sub.id },
          data: { lastTriggered: new Date() },
        });

        results.push({
          type: 'WATER_LEVEL_ABNORMAL',
          spotId: sub.spot.id,
          spotName: sub.spot.name,
          title: `Alerte niveau d'eau - ${sub.spot.name}`,
          body: levelDescription,
        });
      }
    } catch (error) {
      console.error(`Water level evaluation failed for subscription ${sub.id}:`, error);
    }
  }

  return results;
}

/**
 * Evaluate regulation reminders for a user.
 * Checks for upcoming season changes and fishing card expiry.
 */
export async function evaluateRegulationReminders(userId: string): Promise<AlertEvaluationResult[]> {
  const results: AlertEvaluationResult[] = [];

  const subscriptions = await prisma.alertSubscription.findMany({
    where: {
      userId,
      type: 'REGULATION_REMINDER',
      isActive: true,
    },
  });

  if (subscriptions.length === 0) return results;

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Check SpotRegulation for upcoming season changes
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { spotId: true },
  });

  const favoriteSpotIds = favorites.map((f) => f.spotId);

  if (favoriteSpotIds.length > 0) {
    const upcomingRegulations = await prisma.spotRegulation.findMany({
      where: {
        spotId: { in: favoriteSpotIds },
        isActive: true,
        OR: [
          {
            startDate: {
              gte: now,
              lte: sevenDaysFromNow,
            },
          },
          {
            endDate: {
              gte: now,
              lte: sevenDaysFromNow,
            },
          },
        ],
      },
      include: {
        spot: { select: { id: true, name: true, slug: true } },
      },
    });

    for (const reg of upcomingRegulations) {
      // Check if we already notified about this regulation recently
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'REGULATION_CHANGE',
          data: {
            path: ['regulationId'],
            equals: reg.id,
          },
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existingNotification) continue;

      const isStarting = reg.startDate && reg.startDate >= now && reg.startDate <= sevenDaysFromNow;
      const isEnding = reg.endDate && reg.endDate >= now && reg.endDate <= sevenDaysFromNow;

      const title = isStarting
        ? `Nouvelle reglementation sur ${reg.spot.name}`
        : `Fin de reglementation sur ${reg.spot.name}`;

      const body = isStarting
        ? `${reg.description} - Debut le ${reg.startDate!.toLocaleDateString('fr-FR')}.`
        : `${reg.description} - Fin le ${reg.endDate!.toLocaleDateString('fr-FR')}.`;

      await prisma.notification.create({
        data: {
          type: 'REGULATION_CHANGE',
          title,
          body,
          data: {
            spotId: reg.spot.id,
            spotSlug: reg.spot.slug,
            regulationId: reg.id,
            regulationType: reg.type,
          },
          userId,
        },
      });

      results.push({
        type: 'REGULATION_REMINDER',
        spotId: reg.spot.id,
        spotName: reg.spot.name,
        title,
        body,
      });
    }
  }

  // Check FishingCard expiry
  const fishingCards = await prisma.fishingCard.findMany({
    where: {
      userId,
      reminderSent: false,
      endDate: { gte: now },
    },
  });

  for (const card of fishingCards) {
    const daysUntilExpiry = Math.ceil(
      (card.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );

    const reminderDays = [30, 7, 1];
    const shouldRemind = reminderDays.some((d) => daysUntilExpiry <= d);

    if (shouldRemind) {
      const daysText = daysUntilExpiry === 1
        ? 'demain'
        : `dans ${daysUntilExpiry} jours`;

      await prisma.notification.create({
        data: {
          type: 'FISHING_CARD_EXPIRY',
          title: 'Expiration de votre carte de peche',
          body: `Votre carte de peche${card.aappma ? ` (${card.aappma})` : ''} expire ${daysText}, le ${card.endDate.toLocaleDateString('fr-FR')}. Pensez a la renouveler !`,
          data: {
            cardId: card.id,
            endDate: card.endDate.toISOString(),
            daysUntilExpiry,
          },
          userId,
        },
      });

      // Mark reminder as sent if card expires within 1 day
      if (daysUntilExpiry <= 1) {
        await prisma.fishingCard.update({
          where: { id: card.id },
          data: { reminderSent: true },
        });
      }

      results.push({
        type: 'REGULATION_REMINDER',
        title: 'Expiration de votre carte de peche',
        body: `Expire ${daysText}`,
      });
    }
  }

  return results;
}

/**
 * Run all alert evaluations for all users with active subscriptions.
 */
export async function runAllAlerts(): Promise<AlertRunSummary> {
  const summary: AlertRunSummary = {
    usersProcessed: 0,
    alertsTriggered: 0,
    errors: 0,
    details: {
      idealConditions: 0,
      waterLevel: 0,
      regulations: 0,
    },
  };

  // Get all users with active alert subscriptions
  const usersWithAlerts = await prisma.alertSubscription.findMany({
    where: { isActive: true },
    select: { userId: true },
    distinct: ['userId'],
  });

  const uniqueUserIds = usersWithAlerts.map((u) => u.userId);
  summary.usersProcessed = uniqueUserIds.length;

  for (const userId of uniqueUserIds) {
    try {
      // Evaluate ideal conditions
      const idealResults = await evaluateIdealConditions(userId);
      summary.details.idealConditions += idealResults.length;
      summary.alertsTriggered += idealResults.length;
    } catch (error) {
      console.error(`Ideal conditions evaluation failed for user ${userId}:`, error);
      summary.errors++;
    }

    try {
      // Evaluate water level alerts
      const waterResults = await evaluateWaterLevelAlerts(userId);
      summary.details.waterLevel += waterResults.length;
      summary.alertsTriggered += waterResults.length;
    } catch (error) {
      console.error(`Water level evaluation failed for user ${userId}:`, error);
      summary.errors++;
    }

    try {
      // Evaluate regulation reminders
      const regResults = await evaluateRegulationReminders(userId);
      summary.details.regulations += regResults.length;
      summary.alertsTriggered += regResults.length;
    } catch (error) {
      console.error(`Regulation evaluation failed for user ${userId}:`, error);
      summary.errors++;
    }
  }

  return summary;
}

/**
 * Check all fishing cards for upcoming expiry and send notifications.
 * This is a standalone function for the dedicated cron endpoint.
 */
export async function checkCardExpiryReminders(): Promise<{ processed: number; reminders: number }> {
  const now = new Date();
  let processed = 0;
  let reminders = 0;

  // Find all cards that haven't had a reminder sent yet and are expiring soon
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringCards = await prisma.fishingCard.findMany({
    where: {
      reminderSent: false,
      endDate: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  processed = expiringCards.length;

  for (const card of expiringCards) {
    const daysUntilExpiry = Math.ceil(
      (card.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );

    const shouldNotify = daysUntilExpiry <= 30 || daysUntilExpiry <= 7 || daysUntilExpiry <= 1;

    if (shouldNotify) {
      const daysText = daysUntilExpiry === 1
        ? 'demain'
        : daysUntilExpiry === 0
          ? "aujourd'hui"
          : `dans ${daysUntilExpiry} jours`;

      // Check if notification already exists for this card recently
      const existing = await prisma.notification.findFirst({
        where: {
          userId: card.userId,
          type: 'FISHING_CARD_EXPIRY',
          data: { path: ['cardId'], equals: card.id },
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            type: 'FISHING_CARD_EXPIRY',
            title: 'Expiration de votre carte de peche',
            body: `Votre carte de peche${card.aappma ? ` (${card.aappma})` : ''} expire ${daysText}, le ${card.endDate.toLocaleDateString('fr-FR')}.`,
            data: {
              cardId: card.id,
              endDate: card.endDate.toISOString(),
              daysUntilExpiry,
            },
            userId: card.userId,
          },
        });

        reminders++;
      }

      // Mark as sent if expiring within 1 day
      if (daysUntilExpiry <= 1) {
        await prisma.fishingCard.update({
          where: { id: card.id },
          data: { reminderSent: true },
        });
      }
    }
  }

  return { processed, reminders };
}
