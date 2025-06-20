// import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
// import { ApiOperation, ApiTags } from "@nestjs/swagger";
// import { CriteriaService } from "./criteria.service";
// import { CreateCriteriaDto } from "./dto/create-criteria.dto";
// import { UpdateCriteriaDto } from "./dto/update-criteria.dto";

// @ApiTags("criteria")
// @Controller()
// export class CriteriaController {
//   constructor(private readonly service: CriteriaService) {}

//   @Post("projects/:projectPromotionId/criteria")
//   @ApiOperation({ summary: "Créer un critère de notation" })
//   create(@Param("projectPromotionId", ParseIntPipe) projectPromotionId: number, @Body() dto: CreateCriteriaDto) {
//     return this.service.create(projectPromotionId, dto);
//   }

//   @Get("projects/:projectPromotionId/criteria")
//   @ApiOperation({ summary: "Lister les critères pour un projet" })
//   findAll(@Param("projectPromotionId", ParseIntPipe) projectPromotionId: number) {
//     return this.service.findAll(projectPromotionId);
//   }

//   @Put("criteria/:id")
//   @ApiOperation({ summary: "Mettre à jour un critère" })
//   update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCriteriaDto) {
//     return this.service.update(id, dto);
//   }

//   @Delete("criteria/:id")
//   @ApiOperation({ summary: "Supprimer un critère" })
//   remove(@Param("id", ParseIntPipe) id: number) {
//     return this.service.remove(id);
//   }
// }
