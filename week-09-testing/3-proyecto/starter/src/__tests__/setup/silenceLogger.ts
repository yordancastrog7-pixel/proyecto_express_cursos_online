// Winston y Morgan escriben cada petición en consola: en los tests solo estorban.
import { logger } from '../../config/logger';

logger.silent = true;
