/**
 * Template Engine Service
 *
 * Serviço responsável por carregar templates HTML da pasta public
 * e realizar substituição de variáveis.
 *
 * IMPORTANTE PARA PRODUÇÃO:
 * - O binding ASSETS está configurado para servir arquivos da pasta public
 * - Em produção, o Cloudflare Workers serve os arquivos estáticos automaticamente
 * - Usa o fetch padrão do ASSETS binding sem URL específica
 */

export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

export class TemplateEngine {
  private env: CloudflareBindings;

  constructor(env: CloudflareBindings) {
    this.env = env;
  }

  /**
   * Carregar template da pasta public
   *
   * @param templatePath - Caminho do template (ex: 'templates/digest/base.html')
   * @returns Conteúdo do template
   */
  async loadTemplate(templatePath: string): Promise<string> {
    try {
      // Usar o binding ASSETS para acessar arquivos da pasta public
      // O ASSETS binding serve arquivos da pasta configurada no wrangler.jsonc
      const response = await this.env.ASSETS.fetch(
        new Request(`${this.env.CURRENT_URL}/${templatePath}`)
      );

      if (!response.ok) {
        throw new Error(`Template não encontrado: ${templatePath}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`Erro ao carregar template ${templatePath}:`, error);
      throw new Error(`Falha ao carregar template: ${templatePath}`);
    }
  }

  /**
   * Renderizar template com substituição de variáveis
   *
   * @param templateContent - Conteúdo do template
   * @param variables - Variáveis para substituição
   * @returns HTML renderizado
   */
  renderTemplate(templateContent: string, variables: TemplateVariables): string {
    let rendered = templateContent;

    // Substituir variáveis simples {{variavel}}
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const replacement = value !== undefined ? String(value) : '';
      rendered = rendered.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        replacement
      );
    }

    // Remover placeholders não substituídos (opcionais)
    rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');

    return rendered;
  }

  /**
   * Carregar e renderizar template em uma operação
   *
   * @param templatePath - Caminho do template
   * @param variables - Variáveis para substituição
   * @returns HTML renderizado
   */
  async renderTemplateFile(templatePath: string, variables: TemplateVariables): Promise<string> {
    const templateContent = await this.loadTemplate(templatePath);
    return this.renderTemplate(templateContent, variables);
  }

  /**
   * Renderizar template com seções condicionais
   *
   * @param templateContent - Conteúdo do template
   * @param variables - Variáveis principais
   * @param conditionalSections - Seções condicionais para incluir
   * @returns HTML renderizado
   */
  renderWithSections(
    templateContent: string,
    variables: TemplateVariables,
    conditionalSections: { [sectionKey: string]: string }
  ): string {
    let rendered = templateContent;

    // Substituir seções condicionais primeiro
    for (const [sectionKey, sectionContent] of Object.entries(conditionalSections)) {
      const placeholder = `{{${sectionKey}}}`;
      rendered = rendered.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        sectionContent
      );
    }

    // Depois substituir variáveis normais
    return this.renderTemplate(rendered, variables);
  }
}

/**
 * Factory para criar instância do TemplateEngine
 */
export function createTemplateEngine(env: CloudflareBindings): TemplateEngine {
  return new TemplateEngine(env);
}
