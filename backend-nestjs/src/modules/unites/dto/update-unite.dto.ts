import { PartialType } from '@nestjs/mapped-types';
import { CreateUniteDto } from './create-unite.dto';

export class UpdateUniteDto extends PartialType(CreateUniteDto) {}
