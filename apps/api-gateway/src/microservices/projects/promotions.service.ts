import { HttpService } from "@nestjs/axios";
import { BadRequestException, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreatePromotionDto } from "./promotions.controller.js";

interface StudentData {
  name: string;
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

@Injectable()
export class PromotionsService {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  async create(createPromotionDto: CreatePromotionDto) {
    const studentsData = this.parseStudentsCsv(createPromotionDto.students_csv);
    const { students_csv, ...promotionData } = createPromotionDto;

    const { Students } = await this.proxy.forwardRequest<CreateStudentsResponse>(
      "auth-service",
      "users/students",
      "POST",
      studentsData,
    );
    const createdStudents = response.data;

    const promotion = await prisma.promotion.create({
      data: promotionData,
    });

    const studentPromotions = await Promise.all(
      createdStudents.students.map(async (student: CreatedStudent) => {
        return prisma.studentPromotion.create({
          data: {
            promotionId: promotion.id,
            studentId: student.studentId,
          },
        });
      }),
    );

    return {
      ...promotion,
      studentPromotions,
      students: createdStudents.students.map((student: CreatedStudent) => student.studentId),
    };
  }

  private parseStudentsCsv(csv: string): StudentData[] {
    if (!csv || !csv.trim()) {
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

      const [name, firstname, email] = parts;

      students.push({ name, firstname, email });
    }

    return students;
  }
}
function firstValueFrom(arg0: Observable<AxiosResponse<CreateStudentsResponse, any>>) {
  throw new Error("Function not implemented.");
}
