// src/schemas/cadastroSchema.ts
import * as Yup from "yup";

export const cadastroSchema = Yup.object().shape({
  descricao: Yup.string().required(
    "A descrição é obrigatória (ex: Supermercado).",
  ),
  valor: Yup.string()
    .required("O valor é obrigatório.")
    .test("is-valid-number", "Digite um valor numérico válido", (value) => {
      if (!value) return false;
      // Substitui vírgula por ponto para validar corretamente
      const normalizedValue = value.replace(",", ".");
      return !isNaN(Number(normalizedValue)) && Number(normalizedValue) > 0;
    }),
  tipo: Yup.string()
    .oneOf(["Entrada", "Saída"], "Selecione se é uma Entrada ou Saída")
    .required("O tipo da transação é obrigatório."),
});
