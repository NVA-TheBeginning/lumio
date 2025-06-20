import { PartialType } from "@nestjs/swagger";
import { CreateCriteriaDto } from "./create-criteria.dto.js";

export class UpdateCriteriaDto extends PartialType(CreateCriteriaDto) {}
