import {
  redirect,
  useNavigate,
  useLoaderData,
  type MetaFunction,
} from 'react-router';
import { requireAuthWithClient, ensureUserProfile } from '../lib/auth.server';
import type { TemplateWithLocales } from '../types/global';
import {
  getSupportedLocaleFlag,
  getSupportedLocaleName,
} from '../services/locales';
import { appService } from '~/services/app';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Play, Globe, Clock } from 'lucide-react';

const ALL_BRANDS_VALUE = 'all-brands';

export const meta: MetaFunction = () => {
  return [{ title: `Video Templates - ${appService.strings.app.title}` }];
};

function getTemplatesPath(teamSlug: string, brandSlug?: string) {
  return brandSlug
    ? `/${teamSlug}/templates?brand=${encodeURIComponent(brandSlug)}`
    : `/${teamSlug}/templates`;
}

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { teamSlug: string };
}) {
  const { user, supabaseClient } = await requireAuthWithClient(request);

  // Ensure user has a profile
  try {
    await ensureUserProfile(user, request);
  } catch {
    // Continue anyway, the profile creation might have failed but we can still show templates
  }

  // Get team by slug
  const { data: team, error: teamError } = await supabaseClient
    .from('teams')
    .select('id, name, slug')
    .eq('slug', params.teamSlug)
    .single();

  if (teamError || !team) {
    throw new Error('Team not found');
  }

  // Verify user is a member of this team
  const { data: teamMember, error: memberError } = await supabaseClient
    .from('team_members')
    .select('role')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .single();

  if (memberError || !teamMember) {
    throw new Error('Access denied: You are not a member of this team');
  }
  const url = new URL(request.url);
  const selectedBrandSlug = url.searchParams.get('brand') || '';

  const { data: brands, error: brandsError } = await supabaseClient
    .from('brands')
    .select('id, name, slug')
    .eq('team_id', team.id)
    .order('name', { ascending: true });

  if (brandsError) {
    throw new Error('Failed to load brands');
  }
  const selectedBrand = selectedBrandSlug
    ? brands?.find(brand => brand.slug === selectedBrandSlug)
    : null;

  if (selectedBrandSlug && !selectedBrand) {
    return redirect(getTemplatesPath(team.slug));
  }

  // Build query for templates
  let templatesQuery = supabaseClient
    .from('templates')
    .select(
      `
      *,
      template_locales (
        id,
        locale,
        last_render_url,
        thumbnail_url,
        created_at,
        template_id,
        updated_at
      )
    `
    )
    .eq('team_id', team.id);

  if (selectedBrand) {
    templatesQuery = templatesQuery.eq('brand_id', selectedBrand.id);
  }

  const { data: templates, error } = await templatesQuery.order('created_at', {
    ascending: false,
  });

  if (error) {
    throw new Error('Failed to load templates');
  }

  return {
    user,
    team,
    brands: brands || [],
    selectedBrandSlug,
    templates: templates || [],
  };
}

// Helper function to get template status based on locales
function getTemplateStatus(
  template: TemplateWithLocales
): 'completed' | 'in-progress' | 'draft' {
  const locales = template.template_locales || [];
  if (locales.length === 0) return 'draft';
  if (
    locales.some(
      (locale: { last_render_url: string | null }) => locale.last_render_url
    )
  )
    return 'completed';
  return 'in-progress';
}

function formatTemplateDuration(template: TemplateWithLocales) {
  if (!template.duration || template.duration === 0) return '--:--';
  const totalSeconds = Math.floor(template.duration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  function pad(n: number) {
    return n.toString().padStart(2, '0');
  }

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    return `${minutes}:${pad(seconds)}`;
  }
}

// Locale data is now provided by the locales service

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user, team, templates, brands, selectedBrandSlug } =
    useLoaderData<typeof loader>();

  const filteredTemplates = templates;

  const getStatusColor = (status: 'completed' | 'in-progress' | 'draft') => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleTemplateClick = (templateId: string) => {
    // Navigate to the first locale's edit page
    const template = templates.find(t => t.id === templateId);
    if (template?.template_locales?.[0]) {
      navigate(
        `/${team.slug}/templates/${templateId}/${template.template_locales[0].locale}/edit`
      );
    } else {
      // If no locales, navigate to the first available locale (usually 'en')
      navigate(`/${team.slug}/templates/${templateId}/en/edit`);
    }
  };

  const handleBrandChange = (value: string) => {
    if (value === ALL_BRANDS_VALUE) {
      navigate(getTemplatesPath(team.slug));
      return;
    }

    navigate(getTemplatesPath(team.slug, value));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Video Templates
          </h1>
          <p className="text-sm text-muted-foreground">{team.name}</p>
        </div>

        <Select
          value={selectedBrandSlug || ALL_BRANDS_VALUE}
          onValueChange={handleBrandChange}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_BRANDS_VALUE}>All brands</SelectItem>
            {brands.map(brand => (
              <SelectItem key={brand.id} value={brand.slug}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template, index) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 animate-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => handleTemplateClick(template.id)}
          >
            <CardHeader className="p-0">
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={
                    template.thumbnail_url
                      ? template.thumbnail_url
                      : '/video-placeholder.svg'
                  }
                  alt={template.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-t-lg flex items-center justify-center">
                  <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-90 transition-all duration-300 transform scale-75 group-hover:scale-100" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm backdrop-blur-sm">
                  {formatTemplateDuration(template)}
                </div>
                <Badge
                  className={`absolute top-2 left-2 ${getStatusColor(getTemplateStatus(template))} backdrop-blur-sm`}
                  variant="outline"
                >
                  {getTemplateStatus(template).replace('-', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                {template.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Clock className="h-4 w-4" />
                <span suppressHydrationWarning>
                  Created{' '}
                  {new Date(template.created_at || '').toLocaleDateString()}
                </span>
                {template.creator_user_id !== user.id && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    Shared
                  </span>
                )}
              </div>

              {/* Locales */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.template_locales?.map(
                    (
                      locale: { id: string; locale: string },
                      localeIndex: number
                    ) => (
                      <Badge
                        key={locale.id}
                        variant="secondary"
                        className="text-xs transition-all duration-200 hover:scale-105 animate-in slide-in-from-left-2"
                        style={{
                          animationDelay: `${index * 50 + localeIndex * 25}ms`,
                        }}
                      >
                        <span className="mr-1">
                          {getSupportedLocaleFlag(locale.locale)}
                        </span>
                        {getSupportedLocaleName(locale.locale)}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 animate-in fade-in-50 slide-in-from-bottom-4">
          <div className="text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="text-lg mb-2">No templates found</p>
            <p>Try selecting another brand or create a new template</p>
          </div>
        </div>
      )}
    </div>
  );
}
