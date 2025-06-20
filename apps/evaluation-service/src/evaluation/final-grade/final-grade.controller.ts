// import { Body, Controller, Get, Param, ParseIntPipe, Put } from "@nestjs/common";
// import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
// import { UpdateFinalGradeDto } from "./dto/update-final-grade.dto";
// import { FinalGradeService } from "./final-grade.service";

// @ApiTags("final-grades")
// @Controller("projects/:projectPromotionId/final-grades")
// export class FinalGradeController {
//   constructor(private readonly service: FinalGradeService) {}

//   @Get()
//   @ApiOperation({ summary: "Lister les notes finales pour un projet" })
//   @ApiResponse({ status: 200, description: "Notes finales retournées." })
//   findAll(@Param("projectPromotionId", ParseIntPipe) projectPromotionId: number) {
//     return this.service.findAll(projectPromotionId);
//   }

//   @Put()
//   @ApiOperation({ summary: "Mettre à jour les notes finales d’un projet" })
//   @ApiResponse({ status: 200, description: "Notes finales mises à jour." })
//   updateAll(
//     @Param("projectPromotionId", ParseIntPipe) projectPromotionId: number,
//     @Body() dtos: UpdateFinalGradeDto[],
//   ) {
//     return this.service.updateAll(projectPromotionId, dtos);
//   }
// }
