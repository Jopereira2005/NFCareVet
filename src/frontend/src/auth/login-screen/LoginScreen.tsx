import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Nfc, UserRound } from 'lucide-react';

import { Button, Checkbox, Input } from '@/@core/components';
import brandMark from '@/assets/nfcarevet-brand-mark.png';

import './LoginScreen.scss';

export default function LoginScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-label="Login NFCareVet">
        <header className="login-header">
          <img className="login-brand__mark" src={brandMark} alt="" />
          <h1 className="login-brand__name">
            NFCare<span>Vet</span>
          </h1>
          <p className="login-brand__tagline">Gestão Clínica Veterinária</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <Input
            id="username"
            name="username"
            type="text"
            label="Usuário ou E-mail"
            placeholder="Digite seu usuário ou e-mail"
            autoComplete="username"
            leadingIcon={<UserRound />}
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

          <Button type="submit">
            <span>Entrar</span> <ArrowRight aria-hidden="true" />
          </Button>
        </form>

        <div className="login-divider" aria-label="Ou acesse com">
          <span>OU ACESSE COM</span>
        </div>

        <Button
          variant="outlined"
          type="button"
        >
          <Nfc aria-hidden="true" />
          <span>Aproximar Crachá NFC</span>
        </Button>
      </section>
    </main>
  );
}
