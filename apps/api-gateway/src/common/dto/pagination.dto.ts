import { ApiProperty } from "@nestjs/swagger";

export class PaginationMetaDto {
  @ApiProperty({ example: 100, type: Number })
  totalRecords!: number;

  @ApiProperty({ example: 1, type: Number })
  currentPage!: number;

  @ApiProperty({ example: 10, type: Number })
  totalPages!: number;

  @ApiProperty({ example: 2, nullable: true, type: Number })
  nextPage!: number | null;

  @ApiProperty({ example: null, nullable: true, type: Number })
  prevPage!: number | null;
}

/**
 * Classe de base pour Swagger.
 * Vous étendrez cette classe dans chaque controller :
 *
 * export class PaginatedProjectsDto extends PaginatedDto(ProjectDto) {}
 */
export class PaginatedDto<T> {
  @ApiProperty({ isArray: true, description: "Liste des items", type: Array })
  data!: T[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination!: PaginationMetaDto;
}
