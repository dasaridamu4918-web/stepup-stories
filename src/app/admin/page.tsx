import React from "react";
import { redirect } from "next/navigation";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
  isAdminAlertServiceConfigured,
  isCustomerNotificationServiceConfigured
} from "@/lib/email";
import { getAdminDashboardData } from "@/lib/repository";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const auth = await verifyAdminRequest();
  if (!auth.authorized || !auth.email) {
    redirect("/admin/login");
  }

  const data = await getAdminDashboardData();

  return (
    <AdminDashboardClient
      adminEmail={auth.email}
      initialSettings={data.settings}
      initialCollections={data.collections}
      initialProducts={data.products}
      initialEnquiries={data.enquiries}
      initialSubscribers={data.subscribers}
      initialOrders={data.orders}
      initialCustomers={data.customers}
      initialAuditLogs={data.auditLogs}
      initialAlertStatus={{
        emailConfigured: isAdminAlertServiceConfigured(),
        customerNotificationConfigured: isCustomerNotificationServiceConfigured()
      }}
    />
  );
}
