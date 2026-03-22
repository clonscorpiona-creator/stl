/*
 * 🔐 STL Platform - Reset Password Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import defaultStyles from '../login/login.module.css';
import modernStyles from '../login/login-modern.module.css';
import bakeryStyles from '../login/login-bakery.module.css';
import minimalistStyles from '../login/login-minimalist.module.css';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<string>('with-sidebar');

  useEffect(() => {
    if (!token) {
      setError('Отсутствует токен сброса пароля');
    }
  }, [token]);

  // Detect current layout
  useEffect(() => {
    const layout = localStorage.getItem('site-layout') || 'with-sidebar';
    setCurrentLayout(layout);

    const checkLayout = () => {
      const layoutAttr = document.documentElement.getAttribute('data-layout');
      if (layoutAttr) {
        setCurrentLayout(layoutAttr);
      }
    };

    const observer = new MutationObserver(checkLayout);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-layout']
    });

    return () => observer.disconnect();
  }, []);

  // Select styles based on layout
  const styles = currentLayout === 'modern-dark' ? modernStyles :
                 currentLayout === 'bakery-warm' ? bakeryStyles :
                 currentLayout === 'minimalist-modern' ? minimalistStyles :
                 defaultStyles;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Произошла ошибка');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login?reset=success');
      }, 2000);
    } catch (err) {
      setError('Произошла ошибка при сбросе пароля');
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className={styles.container}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>Ошибка</h1>
          <p className={styles.subtitle}>
            Отсутствует токен сброса пароля. Пожалуйста, запросите новую ссылку для сброса.
          </p>
          <Link href="/auth/forgot-password" className={styles.link}>
            Запросить новую ссылку
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className={styles.container}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>Пароль изменен!</h1>
          <p className={styles.subtitle}>
            Ваш пароль успешно изменен. Сейчас вы будете перенаправлены на страницу входа.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Создать новый пароль</h1>
        <p className={styles.subtitle}>
          Введите новый пароль для вашего аккаунта
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Новый пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Минимум 8 символов"
              required
              disabled={loading}
              minLength={8}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Подтвердите пароль
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="Повторите пароль"
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
          </button>

          <p className={styles.linkText}>
            <Link href="/auth/login" className={styles.link}>← Вернуться к входу</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
