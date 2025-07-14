"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { PresentationType, PromotionType } from "@/app/dashboard/teachers/projects/actions";
import { formatDate, formatDateTime, isNotEmpty } from "@/lib/utils";
import { OrderWithGroup } from "@/types/presentation-orders";

interface PresentationOrdersPDFProps {
  presentation: PresentationType;
  promotion: PromotionType;
  orders: OrderWithGroup[];
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: "2 solid #e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 5,
    color: "#6b7280",
  },
  infoSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#374151",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "bold",
    width: 120,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 12,
    color: "#1f2937",
  },
  ordersSection: {
    marginBottom: 20,
  },
  orderItem: {
    flexDirection: "row",
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderLeft: "4 solid #3b82f6",
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    width: 40,
    color: "#1f2937",
  },
  orderContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1f2937",
  },
  scheduledTime: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 5,
  },
  membersTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 3,
    color: "#374151",
  },
  membersList: {
    fontSize: 10,
    color: "#6b7280",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 10,
    borderTop: "1 solid #e5e7eb",
    paddingTop: 10,
  },
});

const calculateScheduledTime = (orderNumber: number, startDatetime: string, durationPerGroup: number) => {
  const startTime = new Date(startDatetime);
  const scheduledTime = new Date(startTime.getTime() + (orderNumber - 1) * durationPerGroup * 60000);
  return formatDateTime(scheduledTime.toISOString());
};

export const PresentationOrdersPDF = ({ presentation, promotion, orders }: PresentationOrdersPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Ordre de Passage</Text>
        <Text style={styles.subtitle}>Soutenance du {formatDate(presentation.startDatetime)}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Informations de la soutenance</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Promotion:</Text>
          <Text style={styles.infoValue}>{promotion.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date de début:</Text>
          <Text style={styles.infoValue}>{formatDateTime(presentation.startDatetime)}</Text>
        </View>
        {isNotEmpty(presentation.endDatetime) && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date de fin:</Text>
            <Text style={styles.infoValue}>{formatDateTime(presentation.endDatetime)}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Durée par groupe:</Text>
          <Text style={styles.infoValue}>{presentation.durationPerGroup} minutes</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nombre de groupes:</Text>
          <Text style={styles.infoValue}>{orders.length}</Text>
        </View>
      </View>

      <View style={styles.ordersSection}>
        <Text style={styles.infoTitle}>Ordre de passage des groupes</Text>
        {orders.map((order, index) => (
          <View key={order.id} style={styles.orderItem}>
            <Text style={styles.orderNumber}>#{index + 1}</Text>
            <View style={styles.orderContent}>
              <Text style={styles.groupName}>{order.group?.name ?? `Groupe ${order.groupId}`}</Text>
              <Text style={styles.scheduledTime}>
                Programmé à:{" "}
                {calculateScheduledTime(index + 1, presentation.startDatetime, presentation.durationPerGroup)}
              </Text>
              <Text style={styles.membersTitle}>Membres ({order.group?.members.length ?? 0}):</Text>
              <Text style={styles.membersList}>
                {order.group?.members.map((member) => `${member.firstname} ${member.lastname}`).join(", ") ??
                  "Aucun membre"}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        Généré le {formatDateTime(new Date().toISOString())} • Lumio - Gestion des soutenances
      </Text>
    </Page>
  </Document>
);
