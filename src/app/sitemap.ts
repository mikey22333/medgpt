import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://clinisynth.com'
  const currentDate = new Date().toISOString()
  
  // Static pages with their priorities and update frequencies
  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/chat`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/documentation`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/security`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/hipaa`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,  
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/api-docs`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }
  ]
  
  // Medical specialty pages (if you have them)
  const medicalSpecialties = [
    'cardiology',
    'oncology', 
    'neurology',
    'pediatrics',
    'psychiatry',
    'radiology',
    'endocrinology',
    'gastroenterology',
    'pulmonology',
    'rheumatology'
  ]
  
  const specialtyPages = medicalSpecialties.map(specialty => ({
    url: `${baseUrl}/specialties/${specialty}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))
  
  // Medical conditions pages (common searches)
  const medicalConditions = [
    'diabetes',
    'hypertension',
    'heart-disease',
    'cancer',
    'depression',
    'anxiety',
    'asthma',
    'arthritis',
    'migraine',
    'obesity'
  ]
  
  const conditionPages = medicalConditions.map(condition => ({
    url: `${baseUrl}/conditions/${condition}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))
  
  return [...staticPages, ...specialtyPages, ...conditionPages]
}
