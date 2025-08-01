import { pdf } from "@react-pdf/renderer";
import type { PresentationType, PromotionType } from "@/app/dashboard/teachers/projects/actions";
import { PresentationOrdersPDF } from "@/components/projects/presentations/presentation-orders-pdf";
import type { OrderWithGroup } from "@/types/presentation-orders";

interface ExportPDFOptions {
  presentation: PresentationType;
  promotion: PromotionType;
  orders: OrderWithGroup[];
}

export const exportPresentationOrdersToPDF = async ({
  presentation,
  promotion,
  orders,
}: ExportPDFOptions): Promise<void> => {
  try {
    const pdfDocument = PresentationOrdersPDF({
      presentation,
      promotion,
      orders,
    });

    const pdfBlob = await pdf(pdfDocument).toBlob();

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;

    const date = new Date(presentation.startDatetime).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const filename = `passage_${promotion.name}_${date}.pdf`;

    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Impossible de générer le PDF");
  }
};
