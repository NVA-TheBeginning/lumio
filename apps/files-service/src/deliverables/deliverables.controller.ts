import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeliverablesService } from '@/deliverables/deliverables.service';
import { CreateDeliverableDto, DeliverableIdParams, ProjectIdParams, UpdateDeliverableDto } from '@/deliverables/dto/deliverables.dto'
import { Deliverables } from '@prisma-files/client';

@ApiTags('deliverables')
@Controller()
@ApiBearerAuth()
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  @Post('projects/deliverables')
  @ApiOperation({ summary: 'Create a new deliverable for a project' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The deliverable has been successfully created.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async create(
    @Param() params: ProjectIdParams,
    @Body() createDeliverableDto: CreateDeliverableDto,
  ): Promise<Deliverables> {
    createDeliverableDto.projectId = Number(params.id);
    return this.deliverablesService.create(createDeliverableDto);
  }

  @Get('projects/:id/deliverables')
  @ApiOperation({ summary: 'Get all deliverables for a project' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all deliverables for the project.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @ApiQuery({ 
    name: 'promoId', 
    required: false, 
    type: Number, 
    description: 'Filter deliverables by promotion ID' 
  })
  async findAll(@Param() params: ProjectIdParams, @Query('promoId') promoId?: number): Promise<Deliverables[]> {
    return this.deliverablesService.findAllByProjectPromo(Number(params.id), promoId ? Number(promoId) : undefined);
  }

  @Get('deliverables/:id')
  @ApiOperation({ summary: 'Get a deliverable by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the deliverable.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Deliverable not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async findOne(@Param() params: DeliverableIdParams): Promise<Deliverables> {
    return this.deliverablesService.findOne(Number(params.id));
  }

  @Put('deliverables/:id')
  @ApiOperation({ summary: 'Update a deliverable' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The deliverable has been successfully updated.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Deliverable not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async update(
    @Param() params: DeliverableIdParams,
    @Body() updateDeliverableDto: UpdateDeliverableDto,
  ): Promise<Deliverables> {
    return this.deliverablesService.update(Number(params.id), updateDeliverableDto);
  }

  @Delete('deliverables/:id')
  @ApiOperation({ summary: 'Delete a deliverable' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The deliverable has been successfully deleted.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Deliverable not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async remove(@Param() params: DeliverableIdParams): Promise<void> {
    return this.deliverablesService.remove(Number(params.id));
  }
}
