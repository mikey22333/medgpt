import { z } from 'zod';

// Schema for author information
export const AuthorSchema = z.object({
  name: z.string().optional(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  affiliation: z.string().optional(),
});

export type Author = z.infer<typeof AuthorSchema>;

// Schema for citation data
export const CitationDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(AuthorSchema).min(1),
  journal: z.string().optional(),
  publisher: z.string().optional(),
  publishedDate: z.string().or(z.date()).optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  doi: z.string().url().optional(),
  url: z.string().url().optional(),
  pmid: z.string().optional(),
  pmcid: z.string().optional(),
  arxivId: z.string().optional(),
  abstract: z.string().optional(),
  citationCount: z.number().int().nonnegative().optional(),
  source: z.enum(['pubmed', 'semantic-scholar', 'europepmc', 'biorxiv', 'arxiv', 'custom']).default('custom'),
  studyType: z.enum(['meta-analysis', 'systematic-review', 'randomized-controlled-trial', 'cohort-study', 'case-control', 'cross-sectional', 'case-report', 'preprint', 'other']).optional(),
  evidenceLevel: z.enum(['1a', '1b', '1c', '2a', '2b', '2c', '3a', '3b', '4', '5']).optional(),
});

export type CitationData = z.infer<typeof CitationDataSchema>;

export class CitationFormatter {
  /**
   * Format authors in a consistent way
   */
  private static formatAuthors(authors: Author[]): string {
    if (!authors || authors.length === 0) return 'Unknown Author';
    
    const formattedAuthors = authors
      .filter(author => author.name || (author.givenName && author.familyName))
      .map(author => {
        if (author.name) return author.name;
        return `${author.givenName} ${author.familyName}`.trim();
      });

    if (formattedAuthors.length === 0) return 'Unknown Author';
    if (formattedAuthors.length === 1) return formattedAuthors[0];
    if (formattedAuthors.length === 2) return `${formattedAuthors[0]} & ${formattedAuthors[1]}`;
    if (formattedAuthors.length > 3) {
      return `${formattedAuthors[0]} et al.`;
    }
    return formattedAuthors.join(', ');
  }

  /**
   * Format a single citation in APA style
   */
  static formatAPACitation(data: CitationData): string {
    const authors = this.formatAuthors(data.authors);
    const year = data.publishedDate 
      ? new Date(data.publishedDate).getFullYear()
      : 'n.d.';
    
    const title = data.title.endsWith('.') 
      ? data.title 
      : `${data.title}.`;

    let citation = `${authors} (${year}). ${title} `;
    
    if (data.journal) {
      citation += `<i>${data.journal}</i>`;
      
      if (data.volume) {
        citation += `, <i>${data.volume}</i>`;
        
        if (data.issue) {
          citation += `(${data.issue})`;
        }
        
        if (data.pages) {
          citation += `, ${data.pages}`;
        }
        
        citation += '.';
      }
    }
    
    if (data.doi) {
      citation += ` https://doi.org/${data.doi.replace('https://doi.org/', '')}`;
    } else if (data.url) {
      citation += ` ${data.url}`;
    }
    
    return citation;
  }

  /**
   * Format a single citation in MLA style
   */
  static formatMLACitation(data: CitationData): string {
    const authors = this.formatAuthors(data.authors);
    const title = data.title.endsWith('.') 
      ? data.title.slice(0, -1) 
      : data.title;
    
    let citation = `${authors}. <i>${title}</i>. `;
    
    if (data.journal) {
      citation += `<i>${data.journal}</i>`;
      
      if (data.volume) {
        citation += `, vol. ${data.volume}`;
        
        if (data.issue) {
          citation += `, no. ${data.issue}`;
        }
        
        if (data.publishedDate) {
          const date = new Date(data.publishedDate);
          const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          citation += `, ${formattedDate}`;
        }
        
        if (data.pages) {
          citation += `, pp. ${data.pages}`;
        }
      }
      
      citation += '.';
    }
    
    if (data.doi) {
      citation += ` doi:${data.doi.replace('https://doi.org/', '')}`;
    } else if (data.url) {
      citation += ` ${data.url}`;
    }
    
    return citation;
  }

  /**
   * Format a single citation in Chicago style
   */
  static formatChicagoCitation(data: CitationData): string {
    const authors = this.formatAuthors(data.authors);
    const title = data.title.endsWith('.') 
      ? data.title 
      : `${data.title}.`;
    
    let citation = `${authors}. "${title}" `;
    
    if (data.journal) {
      citation += `<i>${data.journal}</i>`;
      
      if (data.volume) {
        citation += ` ${data.volume}`;
        
        if (data.issue) {
          citation += `, no. ${data.issue}`;
        }
        
        if (data.publishedDate) {
          const date = new Date(data.publishedDate);
          const year = date.getFullYear();
          const month = date.toLocaleString('default', { month: 'long' });
          const day = date.getDate();
          citation += ` (${month} ${day}, ${year})`;
        }
        
        if (data.pages) {
          citation += `: ${data.pages}`;
        }
      }
      
      citation += '.';
    }
    
    if (data.doi) {
      citation += ` https://doi.org/${data.doi.replace('https://doi.org/', '')}`;
    } else if (data.url) {
      citation += ` ${data.url}`;
    }
    
    return citation;
  }

  /**
   * Format a citation in the specified style
   */
  static formatCitation(
    data: CitationData,
    style: 'apa' | 'mla' | 'chicago' = 'apa'
  ): string {
    try {
      // Validate input data
      const validatedData = CitationDataSchema.parse(data);
      
      switch (style.toLowerCase()) {
        case 'mla':
          return this.formatMLACitation(validatedData);
        case 'chicago':
          return this.formatChicagoCitation(validatedData);
        case 'apa':
        default:
          return this.formatAPACitation(validatedData);
      }
    } catch (error) {
      console.error('Error formatting citation:', error);
      // Return a basic citation if validation fails
      return `${data.authors?.[0]?.name || 'Unknown Author'}. (${data.publishedDate ? new Date(data.publishedDate).getFullYear() : 'n.d.'}). ${data.title}.`;
    }
  }

  /**
   * Format multiple citations
   */
  static formatCitations(
    citations: CitationData[],
    style: 'apa' | 'mla' | 'chicago' = 'apa',
    options: {
      sortBy?: 'year' | 'author' | 'title';
      order?: 'asc' | 'desc';
      includeAbstract?: boolean;
      includeLink?: boolean;
    } = {}
  ): string[] {
    const { sortBy = 'year', order = 'desc', includeAbstract = false, includeLink = true } = options;
    
    // Sort citations
    const sortedCitations = [...citations].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'year': {
          const yearA = a.publishedDate ? new Date(a.publishedDate).getFullYear() : 0;
          const yearB = b.publishedDate ? new Date(b.publishedDate).getFullYear() : 0;
          comparison = yearA - yearB;
          break;
        }
        case 'author': {
          const authorA = this.formatAuthors(a.authors);
          const authorB = this.formatAuthors(b.authors);
          comparison = authorA.localeCompare(authorB);
          break;
        }
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
    
    // Format each citation
    return sortedCitations.map(citation => {
      const formatted = this.formatCitation(citation, style);
      
      if (includeAbstract && citation.abstract) {
        return `${formatted}\n\n${citation.abstract}\n`;
      }
      
      if (includeLink && (citation.doi || citation.url)) {
        return `${formatted} [${citation.doi || citation.url}]`;
      }
      
      return formatted;
    });
  }

  /**
   * Convert citation to BibTeX format
   */
  static toBibTeX(citation: CitationData): string {
    const type = citation.studyType === 'preprint' ? 'article' : 'article';
    const id = citation.doi 
      ? citation.doi.replace(/[^a-zA-Z0-9]/g, '_')
      : `citation_${citation.id}`;
    
    const authors = citation.authors
      .map(author => {
        if (author.name) return author.name;
        return `${author.familyName}, ${author.givenName}`.replace(/,\s*$/, '');
      })
      .join(' and ');
    
    const year = citation.publishedDate 
      ? new Date(citation.publishedDate).getFullYear()
      : 'n.d.';
    
    let bibtex = `@${type}{${id},\n`;
    bibtex += `  author = {${authors}},\n`;
    bibtex += `  title = {{${citation.title}}},\n`;
    
    if (citation.journal) {
      bibtex += `  journal = {${citation.journal}},\n`;
    }
    
    bibtex += `  year = {${year}},\n`;
    
    if (citation.volume) {
      bibtex += `  volume = {${citation.volume}},\n`;
    }
    
    if (citation.issue) {
      bibtex += `  number = {${citation.issue}},\n`;
    }
    
    if (citation.pages) {
      bibtex += `  pages = {${citation.pages}},\n`;
    }
    
    if (citation.doi) {
      bibtex += `  doi = {${citation.doi.replace('https://doi.org/', '')}},\n`;
    }
    
    if (citation.url) {
      bibtex += `  url = {${citation.url}},\n`;
    }
    
    if (citation.abstract) {
      bibtex += `  abstract = {${citation.abstract.replace(/[\r\n]+/g, ' ')}},\n`;
    }
    
    // Remove trailing comma and add closing brace
    bibtex = bibtex.replace(/,\s*$/, '') + '\n}';
    
    return bibtex;
  }
}
