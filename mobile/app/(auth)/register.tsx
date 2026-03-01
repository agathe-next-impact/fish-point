import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { User, Mail, Lock, Fish } from 'lucide-react-native';
import { colors, spacing, typography, SCREEN_PADDING_H } from '@/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRegister } from '@/hooks';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const registerMutation = useRegister();

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }

    registerMutation.mutate(
      { name: name.trim(), email: email.trim(), password },
      {
        onError: (error) => {
          Alert.alert(
            'Erreur',
            error.message || 'Impossible de creer le compte.',
          );
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / branding */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Fish size={40} color={colors.primary[600]} />
            </View>
            <Text style={styles.title}>Creer un compte</Text>
            <Text style={styles.subtitle}>
              Rejoignez la communaute Fish Point
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Nom"
              placeholder="Votre nom"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              icon={<User size={18} color={colors.gray[400]} />}
            />

            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon={<Mail size={18} color={colors.gray[400]} />}
            />

            <Input
              label="Mot de passe"
              placeholder="Minimum 6 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<Lock size={18} color={colors.gray[400]} />}
            />

            <Button
              title="Creer un compte"
              onPress={handleRegister}
              loading={registerMutation.isPending}
              size="lg"
              style={styles.registerButton}
            />
          </View>

          {/* Footer link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Deja un compte ?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}> Se connecter</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_PADDING_H,
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray[500],
    textAlign: 'center',
  },
  form: {
    marginBottom: spacing.xl,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...typography.body,
    color: colors.gray[500],
  },
  footerLink: {
    ...typography.bodyMedium,
    color: colors.primary[600],
  },
});
