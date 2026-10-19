import { describe, expect, it, vi } from "vitest";
import type { supabase } from "../auth/supabase";
import { createReservation, createSpace, loadWorkspaceSnapshot } from "./workspace";

type DataClient = NonNullable<typeof supabase>;

function query(data: unknown, error: unknown = null) {
  const result = { data, error };
  const builder: Record<string, unknown> = {};
  const chain = vi.fn(() => builder);

  for (const method of ["select", "eq", "order", "limit", "insert"]) builder[method] = chain;
  builder.maybeSingle = vi.fn().mockResolvedValue(result);
  builder.then = (resolve: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  return builder;
}

function fakeClient(tableData: Record<string, unknown>) {
  const from = vi.fn((table: string) => tableData[table]);
  const rpc = vi.fn().mockResolvedValue({ error: null });
  return { client: { from, rpc } as unknown as DataClient, from, rpc };
}

describe("workspace data access", () => {
  it("loads real workspace, space, customer, and reservation records", async () => {
    const { client } = fakeClient({
      workspaces: query({ id: "workspace-1", name: "Kıyı Kolektif" }),
      spaces: query([{ id: "space-1", name: "Kıyı Loft", address: "Moda", kind: "Etkinlik alanı", is_active: true }]),
      customers: query([{ id: "customer-1", name: "Aslı Demir", email: "asli@example.com", phone: null }]),
      reservations: query([{
        id: "reservation-1",
        title: "Ürün çekimi",
        starts_at: "2026-10-20T14:30:00.000Z",
        ends_at: "2026-10-20T16:30:00.000Z",
        status: "confirmed",
        space_id: "space-1",
        customer_id: "customer-1",
      }]),
    });

    await expect(loadWorkspaceSnapshot(client)).resolves.toEqual({
      id: "workspace-1",
      name: "Kıyı Kolektif",
      spaces: [{ id: "space-1", name: "Kıyı Loft", address: "Moda", kind: "Etkinlik alanı", isActive: true }],
      customers: [{ id: "customer-1", name: "Aslı Demir", email: "asli@example.com", phone: null }],
      reservations: [{
        id: "reservation-1",
        title: "Ürün çekimi",
        startsAt: "2026-10-20T14:30:00.000Z",
        endsAt: "2026-10-20T16:30:00.000Z",
        status: "confirmed",
        spaceId: "space-1",
        spaceName: "Kıyı Loft",
        customerName: "Aslı Demir",
      }],
    });
  });

  it("writes trimmed space details to the signed-in workspace", async () => {
    const spacesQuery = query(null);
    const { client, from } = fakeClient({ workspaces: query({ id: "workspace-1" }), spaces: spacesQuery });

    await createSpace({ name: "  Kıyı Loft  ", address: "  Moda  ", kind: "  Etkinlik alanı  " }, client);

    expect(from).toHaveBeenCalledWith("workspaces");
    expect(spacesQuery.insert).toHaveBeenCalledWith({ workspace_id: "workspace-1", name: "Kıyı Loft", address: "Moda", kind: "Etkinlik alanı" });
  });

  it("saves the customer and reservation through one database transaction", async () => {
    const { client, rpc } = fakeClient({ workspaces: query({ id: "workspace-1" }) });

    await createReservation({
      spaceId: "space-1",
      title: "  Ürün çekimi ",
      customerName: " Aslı Demir ",
      customerEmail: " asli@example.com ",
      customerPhone: "  ",
      startsAt: "2026-10-20T14:30:00.000Z",
      endsAt: "2026-10-20T16:30:00.000Z",
    }, client);

    expect(rpc).toHaveBeenCalledWith("create_reservation", {
      p_workspace_id: "workspace-1",
      p_space_id: "space-1",
      p_customer_name: "Aslı Demir",
      p_customer_email: "asli@example.com",
      p_customer_phone: null,
      p_title: "Ürün çekimi",
      p_starts_at: "2026-10-20T14:30:00.000Z",
      p_ends_at: "2026-10-20T16:30:00.000Z",
      p_status: "pending",
    });
  });
});
