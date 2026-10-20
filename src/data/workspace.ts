import { supabase } from "../auth/supabase";

export type SpaceRecord = {
  id: string;
  name: string;
  address: string;
  kind: string;
  isActive: boolean;
};

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export type CustomerRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export type ReservationRecord = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
  spaceId: string;
  customerId: string;
  customerEmail: string | null;
  customerPhone: string | null;
  spaceName: string;
  customerName: string;
};

export type WorkspaceSnapshot = {
  id: string;
  name: string;
  spaces: SpaceRecord[];
  customers: CustomerRecord[];
  reservations: ReservationRecord[];
};

export type NewSpace = Pick<SpaceRecord, "name" | "address" | "kind">;

export type NewReservation = {
  spaceId: string;
  title: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startsAt: string;
  endsAt: string;
  status?: ReservationStatus;
};

type DataClient = NonNullable<typeof supabase>;

function requireClient(client: DataClient | null): DataClient {
  if (!client) {
    throw new Error("Supabase bağlantısı yapılandırılmamış. Proje URL'si ve publishable key gerekli.");
  }
  return client;
}

async function getWorkspaceId(client: DataClient) {
  const { data, error } = await client
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) {
    throw new Error("Çalışma alanınız bulunamadı. Supabase veritabanı kurulum yönergelerini uygulayın.");
  }
  return data.id as string;
}

export async function loadWorkspaceSnapshot(clientOverride: DataClient | null = supabase): Promise<WorkspaceSnapshot> {
  const client = requireClient(clientOverride);
  const { data: workspace, error: workspaceError } = await client
    .from("workspaces")
    .select("id,name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (workspaceError) throw workspaceError;
  if (!workspace) {
    throw new Error("Çalışma alanınız bulunamadı. Supabase veritabanı kurulum yönergelerini uygulayın.");
  }

  const workspaceId = workspace.id as string;
  const [spacesResult, customersResult, reservationsResult] = await Promise.all([
    client
      .from("spaces")
      .select("id,name,address,kind,is_active")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    client
      .from("customers")
      .select("id,name,email,phone")
      .eq("workspace_id", workspaceId),
    client
      .from("reservations")
      .select("id,title,starts_at,ends_at,status,space_id,customer_id")
      .eq("workspace_id", workspaceId)
      .order("starts_at", { ascending: true }),
  ]);

  if (spacesResult.error) throw spacesResult.error;
  if (customersResult.error) throw customersResult.error;
  if (reservationsResult.error) throw reservationsResult.error;

  const spaces = (spacesResult.data ?? []).map((space) => ({
    id: space.id as string,
    name: space.name as string,
    address: (space.address as string | null) ?? "",
    kind: space.kind as string,
    isActive: space.is_active as boolean,
  }));
  const spaceNames = new Map(spaces.map((space) => [space.id, space.name]));
  const customers = (customersResult.data ?? []).map((customer) => ({
    id: customer.id as string,
    name: customer.name as string,
    email: (customer.email as string | null) ?? null,
    phone: (customer.phone as string | null) ?? null,
  }));
  const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]));
  const reservations = (reservationsResult.data ?? []).map((reservation) => ({
    id: reservation.id as string,
    title: reservation.title as string,
    startsAt: reservation.starts_at as string,
    endsAt: reservation.ends_at as string,
    status: reservation.status as ReservationStatus,
    spaceId: reservation.space_id as string,
    customerId: reservation.customer_id as string,
    customerEmail: customers.find((customer) => customer.id === reservation.customer_id)?.email ?? null,
    customerPhone: customers.find((customer) => customer.id === reservation.customer_id)?.phone ?? null,
    spaceName: spaceNames.get(reservation.space_id as string) ?? "Mekân silinmiş",
    customerName: customerNames.get(reservation.customer_id as string) ?? "Müşteri silinmiş",
  }));

  return {
    id: workspaceId,
    name: workspace.name as string,
    spaces,
    customers,
    reservations,
  };
}

export async function createSpace(input: NewSpace, clientOverride: DataClient | null = supabase) {
  const client = requireClient(clientOverride);
  const workspaceId = await getWorkspaceId(client);
  const { error } = await client.from("spaces").insert({
    workspace_id: workspaceId,
    name: input.name.trim(),
    address: input.address.trim(),
    kind: input.kind.trim(),
  });
  if (error) throw error;
}

export async function createReservation(input: NewReservation, clientOverride: DataClient | null = supabase) {
  const client = requireClient(clientOverride);
  const workspaceId = await getWorkspaceId(client);
  const { error } = await client.rpc("create_reservation", {
    p_workspace_id: workspaceId,
    p_space_id: input.spaceId,
    p_customer_name: input.customerName.trim(),
    p_customer_email: input.customerEmail.trim() || null,
    p_customer_phone: input.customerPhone.trim() || null,
    p_title: input.title.trim(),
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_status: input.status ?? "pending",
  });
  if (error) throw error;
}

export async function updateReservation(
  id: string,
  customerId: string,
  input: NewReservation,
  clientOverride: DataClient | null = supabase,
) {
  const client = requireClient(clientOverride);
  const workspaceId = await getWorkspaceId(client);
  const normalizedEmail = input.customerEmail.trim().toLowerCase() || null;

  const { data: reservation, error: reservationError } = await client
    .from("reservations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();
  if (reservationError) throw reservationError;
  if (!reservation) throw new Error("Bu rezervasyon bulunamadı veya artık erişilemiyor.");

  let resolvedCustomerId = customerId;
  if (normalizedEmail) {
    const { data: matchingCustomer, error: matchingCustomerError } = await client
      .from("customers")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (matchingCustomerError) throw matchingCustomerError;
    if (matchingCustomer?.id) resolvedCustomerId = matchingCustomer.id as string;
  }

  const { error: customerError } = await client
    .from("customers")
    .update({
      name: input.customerName.trim(),
      email: normalizedEmail,
      phone: input.customerPhone.trim() || null,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", resolvedCustomerId);
  if (customerError) throw customerError;

  const { error } = await client
    .from("reservations")
    .update({
      space_id: input.spaceId,
      customer_id: resolvedCustomerId,
      title: input.title.trim(),
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: input.status ?? "pending",
    })
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteReservation(id: string, clientOverride: DataClient | null = supabase) {
  const client = requireClient(clientOverride);
  const workspaceId = await getWorkspaceId(client);
  const { data, error } = await client
    .from("reservations")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Bu rezervasyon bulunamadı veya silinemedi.");
}
