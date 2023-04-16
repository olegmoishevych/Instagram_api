import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommand } from '@nestjs/cqrs';
import { S3FilesRepository } from '../../adapters/AWS/s3-filesRepository';
import { UsersRepository } from '../repository/users.repository';
import { Profile } from '@prisma/client';

@Injectable()
export class UploadFileCommand {
  constructor(readonly userId: string, readonly photo: Express.Multer.File) {}
}

@CommandHandler(UploadFileCommand)
export class UploadFileUseCase implements ICommand {
  constructor(
    public s3Repo: S3FilesRepository,
    public usersRepo: UsersRepository,
  ) {}

  async execute({ userId, photo }: UploadFileCommand): Promise<Profile> {
    const savedPhoto = await this.s3Repo.saveFile(
      photo.buffer,
      photo.fieldname,
      photo.mimetype,
    );
    return this.usersRepo.updateUserAvatarByUserId(userId, savedPhoto.url);
  }
}
