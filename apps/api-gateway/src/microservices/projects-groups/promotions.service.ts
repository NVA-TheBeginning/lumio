import { BadRequestException, Injectable } from "@nestjs/common";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreatePromotionDto } from "./promotions.controller.js";

interface StudentData {
  lastname: string;
  firstname: string;
  email: string;
}

interface CreatedStudent {
  studentId: number;
  email: string;
  initialPassword: string;
}

interface CreateStudentsResponse {
  students: CreatedStudent[];
}

interface ProjectPromotionDto {
  name: string;
  description: string;
  creatorId: number;
  studentIds: number[];
}

@Injectable()
export class PromotionsService {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  // This method is used to create a new promotion with a list of students.
  async create(createPromotionDto: CreatePromotionDto) {
    const studentsData = this.parseStudentsCsv(createPromotionDto.students_csv);

    const { students } = await this.proxy.forwardRequest<CreateStudentsResponse>(
      "auth",
      "/users/students",
      "POST",
      studentsData,
    );
    const studentIds = students.map((s) => s.studentId);

    const projectDto: ProjectPromotionDto = {
      name: createPromotionDto.name,
      description: createPromotionDto.description,
      creatorId: createPromotionDto.creatorId,
      studentIds,
    };

    return this.proxy.forwardRequest("project", "/promotions", "POST", projectDto);
  }

  private parseStudentsCsv(csv: string): StudentData[] {
    if (!csv?.trim()) {
      return [];
    }

    const lines = csv
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return [];
    }

    const students: StudentData[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const parts = line.split(",").map((part) => part.trim());

      if (parts.length < 3) {
        throw new BadRequestException(`Invalid CSV format at line ${i + 1}. Not enough columns.`);
      }

      const [lastname, firstname, email] = parts;

      students.push({ lastname, firstname, email });
    }

    return students;
  }

  // This method is used to add students to an existing promotion.
  async addStudentsToPromotion(students: StudentData[], promoId: number) {
    const { students: createdStudents } = await this.proxy.forwardRequest<CreateStudentsResponse>(
      "auth",
      "/users/students",
      "POST",
      students,
    );

    const studentIds = createdStudents.map((s) => s.studentId);

    return this.proxy.forwardRequest("project", `/promotions/${promoId}/student`, "POST", { studentIds });
  }
}
