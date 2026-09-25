// TESTS UNITARIOS — course.service.ts
// El repository está simulado: no hay base de datos. Se prueba solo la lógica del
// service (paginación, reglas de propiedad y propagación de errores).
import { Types } from 'mongoose';
import * as service from '../services/course.service';
import * as repo from '../repositories/course.repository';
import { AppError } from '../errors/AppError';
import { ROLES } from '../config/roles';
import { validCourse } from './helpers/factories';

jest.mock('../repositories/course.repository');

const mockedRepo = jest.mocked(repo);

const ownerId = new Types.ObjectId().toString();
const strangerId = new Types.ObjectId().toString();
const courseId = new Types.ObjectId().toString();

// Un curso "de la base" falso creado por `ownerId`.
const courseDoc = () => ({ _id: courseId, ...validCourse, createdBy: new Types.ObjectId(ownerId) }) as never;

describe('course.service', () => {
  describe('findAll', () => {
    it('calcula skip y totalPages a partir de page y limit', async () => {
      mockedRepo.findAll.mockResolvedValue({ data: [{}, {}], total: 25 } as never);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(mockedRepo.findAll).toHaveBeenCalledWith(10, 10); // salta la página 1
      expect(result).toEqual({ data: [{}, {}], total: 25, page: 2, totalPages: 3 });
    });

    it('sin cursos devuelve totalPages 0', async () => {
      mockedRepo.findAll.mockResolvedValue({ data: [], total: 0 } as never);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({ data: [], total: 0, page: 1, totalPages: 0 });
    });
  });

  describe('findById', () => {
    it('devuelve el curso que encuentra el repository', async () => {
      mockedRepo.findById.mockResolvedValue(courseDoc());

      await expect(service.findById(courseId)).resolves.toMatchObject({ title: validCourse.title });
    });

    it('propaga el AppError(404) cuando el curso no existe', async () => {
      mockedRepo.findById.mockRejectedValue(new AppError(404, 'Curso no encontrado'));

      await expect(service.findById(courseId)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('create', () => {
    it('crea el curso a nombre de quien lo envía', async () => {
      const dto = { ...validCourse, active: true };
      mockedRepo.create.mockResolvedValue({ ...dto, createdBy: ownerId } as never);

      await service.create(dto, ownerId);

      expect(mockedRepo.create).toHaveBeenCalledWith(dto, ownerId);
    });

    it('propaga el AppError(409) cuando el título ya existe', async () => {
      mockedRepo.create.mockRejectedValue(new AppError(409, 'Ya existe un registro con ese title'));

      await expect(service.create({ ...validCourse, active: true }, ownerId)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('update (regla: solo el creador o un admin)', () => {
    it('el creador puede modificar su curso', async () => {
      mockedRepo.findById.mockResolvedValue(courseDoc());
      mockedRepo.update.mockResolvedValue({ price: 10 } as never);

      await service.update(courseId, { price: 10 }, { id: ownerId, role: ROLES.USER });

      expect(mockedRepo.update).toHaveBeenCalledWith(courseId, { price: 10 });
    });

    it('un admin puede modificar el curso de otra persona', async () => {
      mockedRepo.findById.mockResolvedValue(courseDoc());
      mockedRepo.update.mockResolvedValue({ price: 10 } as never);

      await service.update(courseId, { price: 10 }, { id: strangerId, role: ROLES.ADMIN });

      expect(mockedRepo.update).toHaveBeenCalledTimes(1);
    });

    it('un usuario que NO es el creador recibe AppError(403) y el curso no se toca', async () => {
      mockedRepo.findById.mockResolvedValue(courseDoc());

      await expect(service.update(courseId, { price: 10 }, { id: strangerId, role: ROLES.USER })).rejects.toMatchObject({
        statusCode: 403,
      });
      expect(mockedRepo.update).not.toHaveBeenCalled();
    });

    it('si el curso no existe propaga el AppError(404) sin intentar actualizar', async () => {
      mockedRepo.findById.mockRejectedValue(new AppError(404, 'Curso no encontrado'));

      await expect(service.update(courseId, { price: 10 }, { id: ownerId, role: ROLES.USER })).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(mockedRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('delega el borrado en el repository', async () => {
      mockedRepo.remove.mockResolvedValue(undefined);

      await service.remove(courseId);

      expect(mockedRepo.remove).toHaveBeenCalledWith(courseId);
    });

    it('propaga el AppError(404) cuando el curso no existe', async () => {
      mockedRepo.remove.mockRejectedValue(new AppError(404, 'Curso no encontrado'));

      await expect(service.remove(courseId)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
