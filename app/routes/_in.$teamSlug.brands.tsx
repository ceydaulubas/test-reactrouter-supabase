import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  type MetaFunction,
} from 'react-router';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Building2, ImageIcon, Plus, Save, Trash2 } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { requireAuthWithClient, ensureUserProfile } from '../lib/auth.server';
import { appService } from '~/services/app';
import type { Brand, Team } from '~/types/global';
import type { Database } from '~/types/supabase';

type TypedSupabaseClient = SupabaseClient<Database>;

interface BrandFormValues {
  name: string;
  slug: string;
  logo_url: string | null;
}

type BrandFormResult =
  | { ok: true; values: BrandFormValues }
  | { ok: false; error: string };

export const meta: MetaFunction = () => {
  return [{ title: `Brands - ${appService.strings.app.title}` }];
};

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getBrandFormValues(formData: FormData): BrandFormResult {
  const name = getStringValue(formData, 'name');
  const rawSlug = getStringValue(formData, 'slug');
  const logoUrl = getStringValue(formData, 'logo_url');
  const slug = normalizeSlug(rawSlug || name);

  if (!name) {
    return { ok: false, error: 'Brand name is required.' };
  }

  if (!slug) {
    return { ok: false, error: 'Brand slug is required.' };
  }

  return {
    ok: true,
    values: {
      name,
      slug,
      logo_url: logoUrl || null,
    },
  };
}

function getMutationErrorMessage(error: { code?: string; message: string }) {
  if (error.code === '23505') {
    return 'A brand with this slug already exists for this team.';
  }

  return error.message;
}

async function getTeamForUser(
  supabaseClient: TypedSupabaseClient,
  userId: string,
  teamSlug: string
) {
  const { data: team, error: teamError } = await supabaseClient
    .from('teams')
    .select('id, name, slug')
    .eq('slug', teamSlug)
    .single();

  if (teamError || !team) {
    throw new Response('Team not found', { status: 404 });
  }

  const { data: teamMember, error: memberError } = await supabaseClient
    .from('team_members')
    .select('role')
    .eq('team_id', team.id)
    .eq('user_id', userId)
    .single();

  if (memberError || !teamMember) {
    throw new Response('Access denied: You are not a member of this team', {
      status: 403,
    });
  }

  return team;
}

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { teamSlug: string };
}) {
  const { user, supabaseClient } = await requireAuthWithClient(request);

  try {
    await ensureUserProfile(user, request);
  } catch {
    // Continue even if profile creation fails; access is still checked below.
  }

  const team = await getTeamForUser(supabaseClient, user.id, params.teamSlug);

  const { data: brands, error } = await supabaseClient
    .from('brands')
    .select('*')
    .eq('team_id', team.id)
    .order('name', { ascending: true });

  if (error) {
    throw new Error('Failed to load brands');
  }

  return { team, brands: brands || [] };
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { teamSlug: string };
}) {
  const { user, supabaseClient } = await requireAuthWithClient(request);
  const team = await getTeamForUser(supabaseClient, user.id, params.teamSlug);
  const formData = await request.formData();
  const intent = getStringValue(formData, 'intent');

  if (intent === 'create') {
    const result = getBrandFormValues(formData);
    if (!result.ok) return { error: result.error };

    const { error } = await supabaseClient.from('brands').insert({
      ...result.values,
      team_id: team.id,
    });

    if (error) return { error: getMutationErrorMessage(error) };

    return redirect(`/${team.slug}/brands`);
  }

  if (intent === 'update') {
    const brandId = getStringValue(formData, 'brand_id');
    const result = getBrandFormValues(formData);

    if (!brandId) return { error: 'Brand id is required.' };
    if (!result.ok) return { error: result.error };

    const { error } = await supabaseClient
      .from('brands')
      .update(result.values)
      .eq('id', brandId)
      .eq('team_id', team.id);

    if (error) return { error: getMutationErrorMessage(error) };

    return redirect(`/${team.slug}/brands`);
  }

  if (intent === 'delete') {
    const brandId = getStringValue(formData, 'brand_id');

    if (!brandId) return { error: 'Brand id is required.' };

    const { error } = await supabaseClient
      .from('brands')
      .delete()
      .eq('id', brandId)
      .eq('team_id', team.id);

    if (error) return { error: error.message };

    return redirect(`/${team.slug}/brands`);
  }

  return { error: 'Invalid action.' };
}

function BrandLogo({ brand }: { brand: Brand }) {
  if (brand.logo_url) {
    return (
      <img
        src={brand.logo_url}
        alt={brand.name}
        className="h-12 w-12 rounded-md border object-cover"
      />
    );
  }

  return (
    <div className="h-12 w-12 rounded-md border bg-muted flex items-center justify-center text-muted-foreground">
      <ImageIcon className="h-5 w-5" />
    </div>
  );
}

export default function BrandsPage() {
  const { team, brands } = useLoaderData<typeof loader>() as {
    team: Pick<Team, 'id' | 'name' | 'slug'>;
    brands: Brand[];
  };
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
        <p className="text-sm text-muted-foreground">{team.name}</p>
      </div>

      {actionData?.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionData.error}
        </div>
      )}

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Create brand</h2>
            <p className="text-sm text-muted-foreground">
              Add a brand for this team.
            </p>
          </div>
        </div>

        <Form
          method="post"
          className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <input type="hidden" name="intent" value="create" />
          <div className="space-y-2">
            <Label htmlFor="create-name">Name</Label>
            <Input id="create-name" name="name" placeholder="Vio Ljusfabrik" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-slug">Slug</Label>
            <Input id="create-slug" name="slug" placeholder="vio-ljusfabrik" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-logo-url">Logo URL</Label>
            <Input
              id="create-logo-url"
              name="logo_url"
              placeholder="https://example.com/logo.png"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="self-end">
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </Form>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">All brands</h2>
        <span className="text-sm text-muted-foreground">
          {brands.length} {brands.length === 1 ? 'brand' : 'brands'}
        </span>
      </div>

      {brands.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-60" />
          <p>No brands yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {brands.map(brand => (
            <Card key={brand.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <BrandLogo brand={brand} />
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate">{brand.name}</CardTitle>
                    <CardDescription className="truncate">
                      /{brand.slug}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value="update" />
                  <input type="hidden" name="brand_id" value={brand.id} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${brand.id}`}>Name</Label>
                      <Input
                        id={`name-${brand.id}`}
                        name="name"
                        defaultValue={brand.name}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`slug-${brand.id}`}>Slug</Label>
                      <Input
                        id={`slug-${brand.id}`}
                        name="slug"
                        defaultValue={brand.slug}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`logo-url-${brand.id}`}>Logo URL</Label>
                    <Input
                      id={`logo-url-${brand.id}`}
                      name="logo_url"
                      defaultValue={brand.logo_url ?? ''}
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} size="sm">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </Form>

                <Form
                  method="post"
                  onSubmit={event => {
                    if (!globalThis.confirm(`Delete ${brand.name}?`)) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="brand_id" value={brand.id} />
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </Form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
