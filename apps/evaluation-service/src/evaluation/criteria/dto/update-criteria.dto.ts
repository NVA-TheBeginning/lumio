import { PartialType } from "@nestjs/swagger";
import { CreateCriteriaDto } from "./create-criteria.dto";

export class UpdateCriteriaDto extends PartialType(CreateCriteriaDto) {}
