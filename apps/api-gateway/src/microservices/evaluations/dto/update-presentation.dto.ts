import { PartialType } from "@nestjs/swagger";
import { CreatePresentationDto } from "./create-presentation.dto.js";

export class UpdatePresentationDto extends PartialType(CreatePresentationDto) {}
