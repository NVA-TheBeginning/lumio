import { BadRequestException, Injectable } from "@nestjs/common";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreatePromotionDto, CreateStudentDto, PromotionWithStudentsDto } from "../dto/promotions.dto.js";

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

interface Promotion {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
  studentPromotions: Array<{ userId: number }>;
}

interface StudentDto {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
}

const regex = /[\r?\n]+/;

@Injectable()
export class PromotionsService {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  /**
   * Crée une nouvelle promotion et les étudiants associés.
   */
  async create(createPromotionDto: CreatePromotionDto): Promise<unknown> {
    const studentsData = this.parseStudentsCsv(createPromotionDto.students_csv);

    const { students } = await this.proxy.forwardRequest<CreateStudentsResponse>(
      "auth",
      "/users/students",
      "POST",
      studentsData,
    );

    const studentIds = students?.map((s) => s.studentId) || [];

    const projectDto: ProjectPromotionDto = {
      name: createPromotionDto.name,
      description: createPromotionDto.description,
      creatorId: createPromotionDto.creatorId,
      studentIds,
    };

    return this.proxy.forwardRequest("project", "/promotions", "POST", projectDto);
  }

  /**
   * Ajoute des étudiants à une promotion existante.
   */
  async addStudentsToPromotion(students: CreateStudentDto[], promoId: number): Promise<unknown> {
    const { students: created } = await this.proxy.forwardRequest<CreateStudentsResponse>(
      "auth",
      "/users/students",
      "POST",
      { students } as { students: StudentData[] },
    );

    const studentIds = created.map((s) => s.studentId);

    return this.proxy.forwardRequest("project", `/promotions/${promoId}/student`, "POST", { studentIds });
  }

  /**
   * Transforme un CSV de lignes lastname,firstname,email en objets StudentData.
   */
  private parseStudentsCsv(csv: string): StudentData[] {
    if (!csv?.trim()) return [];

    const lines = csv
      .split(regex) // supporter CRLF et LF
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const students: StudentData[] = [];
    lines.forEach((line, index) => {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 3) {
        throw new BadRequestException(`Format CSV invalide ligne ${index + 1}: attendu lastname,firstname,email`);
      }
      const [lastname, firstname, email] = parts;
      students.push({ lastname, firstname, email });
    });
    return students;
  }
  /**
   * Récupère toutes les promotions avec leurs étudiants détaillés.
   */
  async findAllWithStudents(): Promise<PromotionWithStudentsDto[]> {
    const promotions = await this.proxy.forwardRequest<Promotion[]>("project", "/promotions", "GET");

    const studentIds = [...new Set(promotions.flatMap((promo) => promo.studentPromotions.map((sp) => sp.userId)))];

    if (studentIds.length === 0) {
      return promotions.map((promo) => ({
        id: promo.id,
        name: promo.name,
        description: promo.description,
        creatorId: promo.creatorId,
        createdAt: promo.createdAt,
        updatedAt: promo.updatedAt,
        students: [],
      }));
    }

    const students = await this.proxy.forwardRequest<StudentDto[]>("auth", `/users?ids=${studentIds.join(",")}`, "GET");

    const studentMap = new Map(students.map((s) => [s.id, s]));

    return promotions.map((promo) => ({
      id: promo.id,
      name: promo.name,
      description: promo.description,
      creatorId: promo.creatorId,
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
      students: promo.studentPromotions
        .map((sp) => studentMap.get(sp.userId))
        .filter((s): s is StudentDto => s !== undefined),
    }));
  }
}
