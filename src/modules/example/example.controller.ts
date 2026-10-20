import type { RequestHandler } from 'express';
import { sendSuccess } from '../../common/utils/response';
import type { CreateExampleInput } from './example.schema';
import { createExample, deleteExample, getExample, listExamples } from './example.service';

/**
 * CONTROLLER — capa HTTP. Lee req, llama al service y responde.
 * NO contiene lógica de negocio: aquí req.body/req.params ya llegan
 * validados por el middleware validate() y los tipos son seguros.
 */
export const getExamples: RequestHandler = (_req, res) => {
  sendSuccess(res, listExamples());
};

export const getExampleById: RequestHandler<{ id: string }> = (req, res) => {
  sendSuccess(res, getExample(req.params.id));
};

export const postExample: RequestHandler = (req, res) => {
  const input = req.body as CreateExampleInput;
  sendSuccess(res, createExample(input), 201);
};

export const deleteExampleById: RequestHandler<{ id: string }> = (req, res) => {
  deleteExample(req.params.id);
  res.status(204).send();
};
