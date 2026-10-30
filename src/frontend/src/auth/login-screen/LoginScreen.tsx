import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Nfc } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

import { Logo } from '@/assets/Logo.tsx';
import { Button, Checkbox, Input } from '@/components/ui';
import { useBadgeLogin, useLogin } from '@/hooks/queries/useSessionMutations';
import { useNfcReader } from '@/hooks/useNfcReader';
import { ROUTES } from '@/router/paths';

import './LoginScreen.scss';

/** Badge used when the browser has no Web NFC (desktop development). */
const SIMULATED_BADGE_SERIAL = 'BA:DG:E0:01';

export default function LoginScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useLogin();
  const badgeLogin = useBadgeLogin();

  // Only internal paths, so a crafted link can't send the user to another site after login
  const redirectTo = searchParams.get('redirectTo');
  const enterApp = () => navigate(redirectTo?.startsWith('/') ? redirectTo : ROUTES.home, { replace: true });

  const badgeReader = useNfcReader({
    onRead: ({ uid }) => badgeLogin.mutate({ badgeUid: uid }, { onSuccess: enterApp }),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    login.mutate(
      { email: String(form.get('email') ?? '').trim(), password: String(form.get('password') ?? ''), remember: form.get('remember') === 'on' },
      { onSuccess: enterApp },
    );
  };

  const handleBadgeLogin = () => {
    if (badgeReader.isSupported) {
      void badgeReader.start();
      return;
    }
    badgeReader.simulate(SIMULATED_BADGE_SERIAL);
  };

  const isBadgeReading = badgeReader.status === 'scanning' || badgeLogin.isPending;

  return (
    <main className="login-page">
      <section className="login-card" aria-label="Login NFCareVet">
        <header className="login-header">
          <Logo className="login-brand__mark" />
          <h1 className="login-brand__name">
            NFCare<span>Vet</span>
          </h1>
          <p className="login-brand__tagline">Gestão Clínica Veterinária</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate aria-describedby={login.isError ? 'login-error' : undefined}>
          <Input
            id="email"
            name="email"
            type="email"
            label="E-mail"
            placeholder="Digite seu e-mail"
            autoComplete="username"
            required
            leadingIcon={<Mail />}
          />

          <div className="field">
            <div className="field__label-row">
              <label htmlFor="password">Senha</label>
              <a href="#" onClick={(event) => event.preventDefault()}>
                Esqueceu a senha?
              </a>
            </div>
            <Input
              id="password"
              name="password"
              type={passwordVisible ? 'text' : 'password'}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
              leadingIcon={<LockKeyhole />}
              trailingAction={
                <Button
                  variant="icon"
                  aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={passwordVisible}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  {passwordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </Button>
              }
            />
          </div>

          <Checkbox id="remember" name="remember" label="Lembrar de mim" />

          {login.isError && (
            <p id="login-error" className="login-form__error" role="alert">
              {login.error.message}
            </p>
          )}

          <Button type="submit" className="login-form__submit" disabled={login.isPending}>
            <span>{login.isPending ? 'Entrando…' : 'Entrar'}</span> <ArrowRight aria-hidden="true" />
          </Button>
        </form>

        <div className="login-divider" aria-label="Ou acesse com">
          <span>OU ACESSE COM</span>
        </div>

        <Button variant="outlined" type="button" onClick={handleBadgeLogin} disabled={badgeLogin.isPending} aria-busy={isBadgeReading}>
          <Nfc aria-hidden="true" />
          <span>{isBadgeReading ? 'Aproxime o crachá do leitor…' : 'Aproximar Crachá NFC'}</span>
        </Button>
        {badgeReader.error && (
          <p className="login-form__error" role="alert">
            {badgeReader.error}
          </p>
        )}
      </section>
    </main>
  );
}
