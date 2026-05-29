import * as Yup from 'yup';

export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Digite um e-mail válido (ex: seu@email.com)')
    .required('O e-mail é obrigatório para acessar.'),
  password: Yup.string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres.')
    .required('A senha não pode ficar em branco.'),
});