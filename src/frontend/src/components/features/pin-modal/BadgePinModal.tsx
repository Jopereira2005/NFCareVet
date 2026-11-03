import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { KeyRound, Nfc } from 'lucide-react';

import { Button, Modal } from '@/components/ui';

import styles from './pin-modal.module.scss';

type BadgePinModalProps = {
  badgeUid: string;
  isPending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (pin: string) => void;
};

export function BadgePinModal({
  badgeUid,
  isPending,
  errorMessage,
  onClose,
  onSubmit,
}: BadgePinModalProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Foca automaticamente no primeiro dígito ao abrir
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Se o usuário colou 4 dígitos
    if (val.length === 4) {
      const pasted = val.split('');
      setDigits(pasted);
      inputRefs.current[3]?.focus();
      onSubmit(val);
      return;
    }

    const nextDigit = val.slice(-1);
    const next = [...digits];
    next[index] = nextDigit;
    setDigits(next);

    if (index < 3) {
      inputRefs.current[index + 1]?.focus();
    } else {
      const fullPin = next.join('');
      if (fullPin.length === 4) {
        onSubmit(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullPin = digits.join('');
  const isComplete = fullPin.length === 4;

  return (
    <Modal
      title="Autenticação por Crachá NFC"
      description="Crachá identificado com sucesso. Digite seu PIN de 4 dígitos para concluir o login."
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!isComplete || isPending}
            onClick={() => isComplete && onSubmit(fullPin)}
          >
            <KeyRound aria-hidden="true" />
            <span>{isPending ? 'Verificando…' : 'Acessar'}</span>
          </Button>
        </>
      }
    >
      <div className={styles['pin-modal']}>
        <div className={styles['pin-modal__badge-preview']}>
          <Nfc aria-hidden="true" />
          <span>Crachá UID: <code>{badgeUid}</code></span>
        </div>

        <p className={styles['pin-modal__instruction']}>
          Por segurança, insira o <strong>PIN pessoal de 4 dígitos</strong> associado ao seu cadastro:
        </p>

        <div className={styles['pin-modal__inputs']}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={isPending}
              onChange={(e) => handleChange(idx, e)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`${styles['pin-modal__digit']} ${
                digit ? styles['pin-modal__digit--filled'] : ''
              } ${errorMessage ? styles['pin-modal__digit--error'] : ''}`}
              aria-label={`Dígito ${idx + 1}`}
            />
          ))}
        </div>

        {errorMessage && (
          <p className={styles['pin-modal__error']} role="alert">
            {errorMessage}
          </p>
        )}

        <p className={styles['pin-modal__hint']}>
          PIN padrão do ambiente de demonstração: <strong>1234</strong>
        </p>
      </div>
    </Modal>
  );
}
