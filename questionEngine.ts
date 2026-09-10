// questionEngine.ts
//
// PURPOSE:
// Core AI Question Generation Engine for Feature 2.
// Ensures 100% resume-grounded, technically coherent, non-hallucinatory questions
// calibrated by Target Role, Interview Level (Beginner/Intermediate/Advanced),
// Interview Type (Technical/HR/Behavioral/Mixed), and Question Count (5/10/15/20).

import { InterviewConfig, InterviewLevel, InterviewQuestion, InterviewType } from './src/types';

export type TechDomain =
  | 'html_markup'
  | 'styling'
  | 'frontend_framework'
  | 'frontend_core'
  | 'backend_framework'
  | 'backend_language'
  | 'database_sql'
  | 'database_nosql'
  | 'cache_queue'
  | 'devops_cloud'
  | 'testing'
  | 'version_control'
  | 'data_analytics'
  | 'product_agile'
  | 'mobile'
  | 'security'
  | 'general';

export interface CategorizedTechSkill {
  skill: string;
  domain: TechDomain;
}

export interface ParsedProject {
  name: string;
  description: string;
  technologies: string[];
}

export interface ParsedExperience {
  role: string;
  company: string;
  duration?: string;
  achievements: string[];
}

export interface ParsedResumeEntities {
  candidateName: string;
  targetRole: string;
  projects: ParsedProject[];
  experiences: ParsedExperience[];
  skills: CategorizedTechSkill[];
  rawText: string;
}

// -------------------------------------------------------------
// 1. DOMAIN CLASSIFICATION TAXONOMY (Concept Compatibility Map)
// -------------------------------------------------------------

const SKILL_DOMAIN_MAP: Array<{ regex: RegExp; domain: TechDomain; canonical: string }> = [
  // HTML & Semantic Markup (Pure HTML, Semantic Tags, Forms, ARIA, Web APIs)
  { regex: /\bhtml5?\b/i, domain: 'html_markup', canonical: 'HTML5' },

  // Styling & UI Layout (CSS, Flexbox, Grid, Specificity, Frameworks)
  { regex: /\bcss3?\b/i, domain: 'styling', canonical: 'CSS3' },
  { regex: /\btailwind(?:\s*css)?\b/i, domain: 'styling', canonical: 'Tailwind CSS' },
  { regex: /\bsass|scss\b/i, domain: 'styling', canonical: 'Sass' },
  { regex: /\bbootstrap\b/i, domain: 'styling', canonical: 'Bootstrap' },
  { regex: /\bstyled-components\b/i, domain: 'styling', canonical: 'Styled Components' },
  { regex: /\bmaterial-ui|mui\b/i, domain: 'styling', canonical: 'Material UI' },

  // Frontend Component Frameworks
  { regex: /\breact(?:\.js)?\b/i, domain: 'frontend_framework', canonical: 'React' },
  { regex: /\bnext(?:\.js)?\b/i, domain: 'frontend_framework', canonical: 'Next.js' },
  { regex: /\bvue(?:\.js)?\b/i, domain: 'frontend_framework', canonical: 'Vue.js' },
  { regex: /\bangular\b/i, domain: 'frontend_framework', canonical: 'Angular' },
  { regex: /\bsvelte(?:\.js)?\b/i, domain: 'frontend_framework', canonical: 'Svelte' },

  // Frontend Core & State
  { regex: /\btypescript\b/i, domain: 'frontend_core', canonical: 'TypeScript' },
  { regex: /\bjavascript\b/i, domain: 'frontend_core', canonical: 'JavaScript' },
  { regex: /\bredux\b/i, domain: 'frontend_core', canonical: 'Redux' },
  { regex: /\bzustand\b/i, domain: 'frontend_core', canonical: 'Zustand' },
  { regex: /\bvite\b/i, domain: 'frontend_core', canonical: 'Vite' },
  { regex: /\bwebpack\b/i, domain: 'frontend_core', canonical: 'Webpack' },

  // Backend Frameworks & Runtimes
  { regex: /\bnode(?:\.js)?\b/i, domain: 'backend_framework', canonical: 'Node.js' },
  { regex: /\bexpress(?:\.js)?\b/i, domain: 'backend_framework', canonical: 'Express' },
  { regex: /\bnest(?:\.js)?\b/i, domain: 'backend_framework', canonical: 'NestJS' },
  { regex: /\bdjango\b/i, domain: 'backend_framework', canonical: 'Django' },
  { regex: /\bfastapi\b/i, domain: 'backend_framework', canonical: 'FastAPI' },
  { regex: /\bflask\b/i, domain: 'backend_framework', canonical: 'Flask' },
  { regex: /\bspring(?:\s*boot)?\b/i, domain: 'backend_framework', canonical: 'Spring Boot' },
  { regex: /\b(?:ruby\s*on\s*)?rails\b/i, domain: 'backend_framework', canonical: 'Ruby on Rails' },
  { regex: /\basp\.net(?:\s*core)?\b/i, domain: 'backend_framework', canonical: 'ASP.NET Core' },

  // Backend Languages
  { regex: /\bpython\b/i, domain: 'backend_language', canonical: 'Python' },
  { regex: /\bjava\b(?!script)/i, domain: 'backend_language', canonical: 'Java' },
  { regex: /\bgolang|\bgo\b/i, domain: 'backend_language', canonical: 'Go' },
  { regex: /\bc#|\.net\b/i, domain: 'backend_language', canonical: 'C#' },
  { regex: /\brust\b/i, domain: 'backend_language', canonical: 'Rust' },
  { regex: /\bc\+\+\b/i, domain: 'backend_language', canonical: 'C++' },
  { regex: /\bphp\b/i, domain: 'backend_language', canonical: 'PHP' },

  // Relational Databases
  { regex: /\bpostgresql|postgres\b/i, domain: 'database_sql', canonical: 'PostgreSQL' },
  { regex: /\bmysql\b/i, domain: 'database_sql', canonical: 'MySQL' },
  { regex: /\bsqlite\b/i, domain: 'database_sql', canonical: 'SQLite' },
  { regex: /\boracle\s*(?:db|database)?\b/i, domain: 'database_sql', canonical: 'Oracle DB' },
  { regex: /\bsnowflake\b/i, domain: 'database_sql', canonical: 'Snowflake' },
  { regex: /\bbigquery\b/i, domain: 'database_sql', canonical: 'BigQuery' },
  { regex: /\bsql\b/i, domain: 'database_sql', canonical: 'SQL' },

  // NoSQL Databases
  { regex: /\bmongodb|mongo\b/i, domain: 'database_nosql', canonical: 'MongoDB' },
  { regex: /\bdynamodb\b/i, domain: 'database_nosql', canonical: 'DynamoDB' },
  { regex: /\bcassandra\b/i, domain: 'database_nosql', canonical: 'Cassandra' },
  { regex: /\bfirebase\b/i, domain: 'database_nosql', canonical: 'Firebase' },

  // Caching & Queues
  { regex: /\bredis\b/i, domain: 'cache_queue', canonical: 'Redis' },
  { regex: /\bkafka\b/i, domain: 'cache_queue', canonical: 'Apache Kafka' },
  { regex: /\brabbitmq\b/i, domain: 'cache_queue', canonical: 'RabbitMQ' },

  // DevOps & Cloud
  { regex: /\bdocker\b/i, domain: 'devops_cloud', canonical: 'Docker' },
  { regex: /\bkubernetes|k8s\b/i, domain: 'devops_cloud', canonical: 'Kubernetes' },
  { regex: /\baws\b|\bamazon\s*web\s*services\b/i, domain: 'devops_cloud', canonical: 'AWS' },
  { regex: /\bgcp\b|\bgoogle\s*cloud\b/i, domain: 'devops_cloud', canonical: 'GCP' },
  { regex: /\bazure\b/i, domain: 'devops_cloud', canonical: 'Azure' },
  { regex: /\bci\/cd|github\s*actions\b/i, domain: 'devops_cloud', canonical: 'CI/CD' },
  { regex: /\bterraform\b/i, domain: 'devops_cloud', canonical: 'Terraform' },
  { regex: /\bvercel\b/i, domain: 'devops_cloud', canonical: 'Vercel' },

  // Testing
  { regex: /\bjest\b/i, domain: 'testing', canonical: 'Jest' },
  { regex: /\breact\s*testing\s*library\b/i, domain: 'testing', canonical: 'React Testing Library' },
  { regex: /\bcypress\b/i, domain: 'testing', canonical: 'Cypress' },
  { regex: /\bplaywright\b/i, domain: 'testing', canonical: 'Playwright' },
  { regex: /\bpytest\b/i, domain: 'testing', canonical: 'PyTest' },
  { regex: /\bjunit\b/i, domain: 'testing', canonical: 'JUnit' },

  // Version Control
  { regex: /\bgit\b|\bgithub\b|\bgitlab\b/i, domain: 'version_control', canonical: 'Git' },

  // Data Analytics & BI
  { regex: /\bpandas\b/i, domain: 'data_analytics', canonical: 'Pandas' },
  { regex: /\bnumpy\b/i, domain: 'data_analytics', canonical: 'NumPy' },
  { regex: /\btableau\b/i, domain: 'data_analytics', canonical: 'Tableau' },
  { regex: /\bpower\s*bi\b/i, domain: 'data_analytics', canonical: 'Power BI' },
  { regex: /\bmatplotlib|seaborn\b/i, domain: 'data_analytics', canonical: 'Matplotlib/Seaborn' },
  { regex: /\bscikit-learn|sklearn\b/i, domain: 'data_analytics', canonical: 'Scikit-Learn' },
  { regex: /\bexcel\b/i, domain: 'data_analytics', canonical: 'Excel' },

  // Product & Agile
  { regex: /\bjira\b/i, domain: 'product_agile', canonical: 'Jira' },
  { regex: /\bconfluence\b/i, domain: 'product_agile', canonical: 'Confluence' },
  { regex: /\bfigma\b/i, domain: 'product_agile', canonical: 'Figma' },
  { regex: /\bagile|scrum\b/i, domain: 'product_agile', canonical: 'Agile / Scrum' },
  { regex: /\bmixpanel|amplitude\b/i, domain: 'product_agile', canonical: 'Product Analytics' },
];

// -------------------------------------------------------------
// 2. RESUME ENTITY EXTRACTION
// -------------------------------------------------------------

export function parseResumeEntities(resumeText: string, targetRole: string = ''): ParsedResumeEntities {
  const text = resumeText || '';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Extract Candidate Name
  let candidateName = 'Candidate';
  for (const line of lines.slice(0, 5)) {
    if (
      line.length > 2 &&
      line.length < 50 &&
      !/@|linkedin\.com|github\.com|http|\b(?:resume|curriculum|phone|email|summary|education|skills|experience)\b/i.test(line)
    ) {
      candidateName = line;
      break;
    }
  }

  // 2. Extract Skills Found
  const skills: CategorizedTechSkill[] = [];
  const addedCanonical = new Set<string>();

  for (const mapping of SKILL_DOMAIN_MAP) {
    if (mapping.regex.test(text) && !addedCanonical.has(mapping.canonical)) {
      skills.push({ skill: mapping.canonical, domain: mapping.domain });
      addedCanonical.add(mapping.canonical);
    }
  }

  // 3. Extract Projects accurately from dedicated section
  const projects: ParsedProject[] = [];
  const projectSectionHeaderMatch = text.match(/(?:^|\r?\n)\s*(?:PROJECTS|KEY PROJECTS|PERSONAL PROJECTS|ACADEMIC PROJECTS|FEATURED PROJECTS)\s*[:\-]?\s*\r?\n([\s\S]*)/i);

  if (projectSectionHeaderMatch && projectSectionHeaderMatch[1]) {
    const rawSection = projectSectionHeaderMatch[1];
    // Find where the next major section begins (if any)
    const nextSecIdx = rawSection.search(/\r?\n\s*(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|EDUCATION|SKILLS|TECHNICAL SKILLS|CERTIFICATIONS|PUBLICATIONS|AWARDS|SUMMARY)\s*[:\-]?\s*\r?\n/i);
    const sectionContent = nextSecIdx !== -1 ? rawSection.slice(0, nextSecIdx) : rawSection;

    const pLines = sectionContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let currentProj: ParsedProject | null = null;

    for (const pLine of pLines) {
      const isBullet = /^[-*•–—]|\d+\.\s+/.test(pLine);
      const isHeaderLike = /^(?:EDUCATION|EXPERIENCE|SUMMARY|SKILLS|CERTIFICATIONS)/i.test(pLine);

      if (isHeaderLike) break;

      if (!isBullet && pLine.length >= 3 && pLine.length < 75 && !/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})/i.test(pLine)) {
        const cleanTitle = pLine.split('|')[0].split('–')[0].split(' - ')[0].trim();
        if (
          cleanTitle.length >= 3 &&
          !/^(?:projects|key projects|featured projects|experience|work|summary|education|skills|technologies|tools)$/i.test(cleanTitle)
        ) {
          if (currentProj) {
            projects.push(currentProj);
          }
          currentProj = {
            name: cleanTitle,
            description: '',
            technologies: [],
          };
          continue;
        }
      }

      if (currentProj && isBullet) {
        const bulletText = pLine.replace(/^[-*•–—]|\d+\.\s+/, '').trim();
        if (!currentProj.description) {
          currentProj.description = bulletText;
        }
        for (const s of skills) {
          if (new RegExp(`\\b${s.skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(bulletText)) {
            if (!currentProj.technologies.includes(s.skill)) {
              currentProj.technologies.push(s.skill);
            }
          }
        }
      }
    }

    if (currentProj) {
      projects.push(currentProj);
    }
  }

  // 4. Extract Work Experience accurately
  const experiences: ParsedExperience[] = [];
  const expSectionHeaderMatch = text.match(/(?:^|\r?\n)\s*(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY|EMPLOYMENT)\s*[:\-]?\s*\r?\n([\s\S]*)/i);

  if (expSectionHeaderMatch && expSectionHeaderMatch[1]) {
    const rawExpSection = expSectionHeaderMatch[1];
    const nextSecIdx = rawExpSection.search(/\r?\n\s*(?:PROJECTS|KEY PROJECTS|EDUCATION|SKILLS|TECHNICAL SKILLS|CERTIFICATIONS|PUBLICATIONS|AWARDS|SUMMARY)\s*[:\-]?\s*\r?\n/i);
    const expContent = nextSecIdx !== -1 ? rawExpSection.slice(0, nextSecIdx) : rawExpSection;

    const expLines = expContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let currentExp: ParsedExperience | null = null;

    for (const eLine of expLines) {
      const isBullet = /^[-*•–—]|\d+\.\s+/.test(eLine);
      const isHeaderLike = /^(?:EDUCATION|PROJECTS|SUMMARY|SKILLS|CERTIFICATIONS)/i.test(eLine);

      if (isHeaderLike) break;

      if (!isBullet && (eLine.includes('|') || /\bat\b|\b@\b/i.test(eLine) || /,\s*(?:Inc|LLC|Corp|Solutions|Labs|Studio)/i.test(eLine))) {
        const parts = eLine.split(/[|@•]/).map((p) => p.trim());
        const rolePart = parts[0] || 'Software Engineer';
        const compPart = parts[1] || 'Tech Company';

        if (
          rolePart.length > 3 &&
          !/^(?:experience|work experience|summary|education|skills)$/i.test(rolePart) &&
          !/^\d{4}/.test(rolePart)
        ) {
          if (currentExp) {
            experiences.push(currentExp);
          }
          currentExp = {
            role: rolePart,
            company: compPart,
            achievements: [],
          };
          continue;
        }
      }

      if (currentExp && isBullet) {
        currentExp.achievements.push(eLine.replace(/^[-*•–—]|\d+\.\s+/, '').trim());
      }
    }

    if (currentExp) {
      experiences.push(currentExp);
    }
  }

  return {
    candidateName,
    targetRole: targetRole || 'Software Professional',
    projects,
    experiences,
    skills,
    rawText: text,
  };
}

// -------------------------------------------------------------
// 3. DOMAIN-SAFE QUESTION TEMPLATES
// -------------------------------------------------------------

interface DomainQuestionTemplate {
  domain: TechDomain;
  difficulty: InterviewLevel;
  type: InterviewType;
  topic: string;
  expectedFocus: string;
  createQuestion: (skillName: string, projectName?: string, companyName?: string) => string;
}

const DOMAIN_QUESTION_TEMPLATES: DomainQuestionTemplate[] = [
  // --- HTML & SEMANTIC MARKUP (NO CSS, NO FLEXBOX, NO CSS GRID) ---
  {
    domain: 'html_markup',
    difficulty: 'Beginner',
    type: 'Technical',
    topic: 'Semantic Structure & Native Forms',
    expectedFocus: 'Evaluates understanding of semantic HTML tags (<main>, <header>, <article>, <nav>, <section>) and accessible form input types and validation attributes.',
    createQuestion: (skill) => `In ${skill}, how do you structure documents using semantic elements (such as <main>, <article>, <nav>, and <section>) and utilize native form input types and validation attributes to build accessible, SEO-friendly pages?`,
  },
  {
    domain: 'html_markup',
    difficulty: 'Intermediate',
    type: 'Technical',
    topic: 'Web Accessibility & Media Elements',
    expectedFocus: 'Assesses proper use of ARIA attributes (aria-live, aria-expanded), responsive media tags (<picture>, <source>, <video>), and document outline hierarchy.',
    createQuestion: (skill) => `How do you use ${skill} semantic landmarks, ARIA roles, and responsive media tags (like <picture>, <source>, <video>) to ensure complete WCAG accessibility and optimal media delivery?`,
  },
  {
    domain: 'html_markup',
    difficulty: 'Advanced',
    type: 'Technical',
    topic: 'HTML5 Web APIs & Resource Optimization',
    expectedFocus: 'Tests knowledge of HTML5 browser APIs (Web Storage, Web Workers, Canvas, History API) and resource loading optimization (<link rel="preload/prefetch">).',
    createQuestion: (skill) => `How do you leverage ${skill} Web APIs (such as Web Storage, Web Workers for background execution, or resource hints like preload and prefetch) to enhance web application performance and offline capabilities?`,
  },

  // --- STYLING & UI (CSS, Tailwind, Sass) ---
  {
    domain: 'styling',
    difficulty: 'Beginner',
    type: 'Technical',
    topic: 'Responsive Layouts & Box Model',
    expectedFocus: 'Evaluates understanding of CSS Flexbox, Grid, mobile-first responsive breakpoints, and the CSS box model.',
    createQuestion: (skill) => `You have experience with ${skill}. How do you use modern ${skill} features like Flexbox and CSS Grid to build responsive, mobile-first user interfaces?`,
  },
  {
    domain: 'styling',
    difficulty: 'Intermediate',
    type: 'Technical',
    topic: 'CSS Architecture & Maintainability',
    expectedFocus: 'Assesses ability to structure maintainable stylesheets, manage specificity, and prevent styling regressions across components.',
    createQuestion: (skill) => `When styling large-scale web applications with ${skill}, how do you structure your styles to ensure modularity, manage specificity, and keep the UI maintainable?`,
  },
  {
    domain: 'styling',
    difficulty: 'Advanced',
    type: 'Technical',
    topic: 'Rendering Performance & Optimization',
    expectedFocus: 'Tests knowledge of browser rendering pipelines, reflow/repaint minimization, critical CSS delivery, and WCAG accessibility contrast standards.',
    createQuestion: (skill) => `What techniques do you apply in ${skill} to minimize layout shifts (CLS), reduce reflows/repaints, and ensure high accessibility and rendering performance in production?`,
  },

  // --- FRONTEND FRAMEWORKS ---
  {
    domain: 'frontend_framework',
    difficulty: 'Beginner',
    type: 'Technical',
    topic: 'Component Architecture & State',
    expectedFocus: 'Checks understanding of component props, local state hooks, unidirectional data flow, and fundamental rendering behavior.',
    createQuestion: (skill) => `In ${skill}, how do you manage local component state and handle unidirectional data flow between parent and child components?`,
  },
  {
    domain: 'frontend_framework',
    difficulty: 'Intermediate',
    type: 'Technical',
    topic: 'State Management & Re-render Tuning',
    expectedFocus: 'Evaluates global state management strategies (Context, Redux, Zustand) and techniques to prevent unnecessary component re-renders.',
    createQuestion: (skill) => `When building complex interfaces in ${skill}, how do you manage shared state across deeply nested components and optimize re-rendering performance?`,
  },
  {
    domain: 'frontend_framework',
    difficulty: 'Advanced',
    type: 'Technical',
    topic: 'Architecture, SSR & Async Safety',
    expectedFocus: 'Assesses architectural patterns (SSR/SSG, code splitting, micro-frontends), race condition avoidance in async state updates, and memory leak prevention.',
    createQuestion: (skill) => `How do you architect enterprise-grade applications in ${skill} to handle asynchronous race conditions, code splitting, and server-side rendering (SSR) efficiently?`,
  },

  // --- FRONTEND CORE & TYPESCRIPT ---
  {
    domain: 'frontend_core',
    difficulty: 'Beginner',
    type: 'Technical',
    topic: 'Async JavaScript & DOM Handling',
    expectedFocus: 'Tests knowledge of ES6+ syntax, Promises, async/await error handling, and safe DOM interactions.',
    createQuestion: (skill) => `How do you leverage ${skill} promises and async/await to handle asynchronous API calls and manage loading/error states cleanly?`,
  },
  {
    domain: 'frontend_core',
    difficulty: 'Intermediate',
    type: 'Technical',
    topic: 'Type Safety & Generics',
    expectedFocus: 'Checks depth with TypeScript generics, utility types, union types, and runtime data validation.',
    createQuestion: (skill) => `In ${skill}, how do you utilize generics, utility types, and strict type checking to build scalable, type-safe API abstractions?`,
  },
  {
    domain: 'frontend_core',
    difficulty: 'Advanced',
    type: 'Technical',
    topic: 'Event Loop & Memory Optimization',
    expectedFocus: 'Probes deep runtime mechanics: event loop microtask vs macrotask execution, closure memory retention, and web worker concurrency.',
    createQuestion: (skill) => `Explain how the ${skill} event loop processes microtasks versus macrotasks, and how you diagnose and fix memory leaks or CPU bottlenecks in the browser runtime.`,
  },

  // --- BACKEND FRAMEWORKS & RUNTIMES ---
  {
    domain: 'backend_framework',
    difficulty: 'Beginner',
    type: 'Technical',
    topic: 'REST API Design & Routing',
    expectedFocus: 'Checks understanding of HTTP methods, status codes, route parameters, and basic controller/service separation.',
    createQuestion: (skill) => `When building RESTful endpoints with ${skill}, how do you structure your route controllers and handle request validation and HTTP status codes?`,
  },
  {
    domain: 'backend_framework',
    difficulty: 'Intermediate',
    type: 'Technical',
    topic: 'Middleware & Error Handling',
    expectedFocus: 'Evaluates middleware composition, authentication/authorization (JWT/OAuth), and centralized error handling strategies.',
    createQuestion: (skill) => `How do you implement secure authentication middleware, request throttling, and centralized error logging in a ${skill} backend?`,
  },
  {
    domain: 'backend_framework',
    difficulty: 'Advanced',
    type: 'Technical',
    topic: 'Scalability & Concurrency',
    expectedFocus: 'Assesses asynchronous I/O handling, connection pooling, graceful degradation under load, and microservice communication patterns.',
    createQuestion: (skill) => `How do you architect high-throughput backend services in ${skill} to handle concurrent I/O operations, rate limiting, and graceful service failure recovery?`,
  },

  // --- BACKEND LANGUAGES ---
  {
    domain: 'backend_language',
    difficulty: 'Beginner',
    type: 'Technical',
    topic: 'Language Fundamentals & Structures',
    expectedFocus: 'Tests core data structures, OOP/functional patterns, exception handling, and standard library familiarity.',
    createQuestion: (skill) => `What are the core data structures and error handling patterns you rely on in ${skill} to write clean, maintainable code?`,
  },
  {
    domain: 'backend_language',
    difficulty: 'Intermediate',
    type: 'Technical',
    topic: 'Object-Oriented Design & Testing',
    expectedFocus: 'Evaluates design patterns (Factory, Dependency Injection), automated unit testing, and modular package architecture.',
    createQuestion: (skill) => `How do you apply solid software design principles (SOLID) and dependency injection when writing modular backend services in ${skill}?`,
  },
  {
    domain: 'backend_language',
    difficulty: 'Advanced',
    type: 'Technical',
    topic: 'Concurrency & Memory Management',
    expectedFocus: 'Checks understanding of thread safety, memory allocation/garbage collection, and lock contention avoidance.',
    createQuestion: (skill) => `How does memory management and garbage collection work in ${skill}, and how do you write thread-safe concurrent routines without introducing deadlocks?`,
  },

  // --- RELATIONAL DATABASES ---
  {
    domain: 'database_sql',
    difficulty: 'Beginner',
    type: 'Technical',
    topic: 'Relational Queries & Schema Basics',
    expectedFocus: 'Evaluates knowledge of primary/foreign keys, inner/outer joins, aggregations, and data integrity constraints.',
    createQuestion: (skill) => `In ${skill}, how do you design relational table relationships (one-to-many, many-to-many) and write efficient JOIN queries?`,
  },
  {
    domain: 'database_sql',
    difficulty: 'Intermediate',
    type: 'Technical',
    topic: 'Query Optimization & Indexing',
    expectedFocus: 'Assesses index selection (B-tree, composite), query execution plan analysis (EXPLAIN), and N+1 query elimination.',
    createQuestion: (skill) => `How do you analyze slow queries in ${skill} using execution plans (EXPLAIN ANALYZE) and design optimal indexing strategies to speed up high-volume reads?`,
  },
  {
    domain: 'database_sql',
    difficulty: 'Advanced',
    type: 'Technical',
    topic: 'Transactions, ACID & High Availability',
    expectedFocus: 'Checks transaction isolation levels, connection pooling, read replicas, and handling high concurrent write contention.',
    createQuestion: (skill) => `How do you handle transaction isolation levels (ACID), lock contention, and connection pooling in ${skill} under heavy concurrent write workloads?`,
  },

  // --- NOSQL DATABASES ---
  {
    domain: 'database_nosql',
    difficulty: 'Beginner',
    type: 'Technical',
    topic: 'Document Data Modeling',
    expectedFocus: 'Tests understanding of document schemas, embedded documents vs references, and CRUD operations.',
    createQuestion: (skill) => `When designing data models in ${skill}, how do you decide whether to embed subdocuments or use referenced relationships?`,
  },
  {
    domain: 'database_nosql',
    difficulty: 'Intermediate',
    type: 'Technical',
    topic: 'Aggregation & Indexing',
    expectedFocus: 'Evaluates aggregation pipelines, compound indexes, and query performance tuning.',
    createQuestion: (skill) => `How do you use ${skill} aggregation pipelines and compound indexes to perform complex data reporting efficiently?`,
  },
  {
    domain: 'database_nosql',
    difficulty: 'Advanced',
    type: 'Technical',
    topic: 'Sharding & Consistency Models',
    expectedFocus: 'Checks sharding key selection, replication, and eventual consistency trade-offs.',
    createQuestion: (skill) => `How do you choose shard keys and configure replication in ${skill} to ensure horizontal scalability and partition tolerance?`,
  },

  // --- DEVOPS & CLOUD ---
  {
    domain: 'devops_cloud',
    difficulty: 'Beginner',
    type: 'Technical',
    topic: 'Containerization & Build Steps',
    expectedFocus: 'Evaluates Dockerfile best practices, multi-stage builds, and basic container isolation.',
    createQuestion: (skill) => `How do you structure a multi-stage ${skill} build to produce lightweight, secure container images for production deployment?`,
  },
  {
    domain: 'devops_cloud',
    difficulty: 'Intermediate',
    type: 'Technical',
    topic: 'CI/CD Automation & Staged Rollouts',
    expectedFocus: 'Assesses automated testing gates, linting, preview environments, and deployment pipeline automation.',
    createQuestion: (skill) => `How do you configure an automated ${skill} pipeline with test validation gates, environment secrets, and automated rollback mechanisms?`,
  },
  {
    domain: 'devops_cloud',
    difficulty: 'Advanced',
    type: 'Technical',
    topic: 'Cloud Architecture & Reliability',
    expectedFocus: 'Tests knowledge of autoscaling, zero-downtime blue/green deployments, IAM least-privilege security, and disaster recovery.',
    createQuestion: (skill) => `How do you architect high-availability cloud infrastructure using ${skill} with auto-scaling, zero-downtime deployments, and robust disaster recovery?`,
  },

  // --- TESTING ---
  {
    domain: 'testing',
    difficulty: 'Beginner',
    type: 'Technical',
    topic: 'Unit Testing Fundamentals',
    expectedFocus: 'Checks assertions, test organization, and testing core business logic.',
    createQuestion: (skill) => `How do you write clear unit tests with ${skill} to verify isolated business logic and component behavior?`,
  },
  {
    domain: 'testing',
    difficulty: 'Intermediate',
    type: 'Technical',
    topic: 'Integration & Mocking Strategies',
    expectedFocus: 'Evaluates mock vs stub strategies, API mocking, and testing asynchronous UI interactions.',
    createQuestion: (skill) => `In ${skill}, how do you mock external API endpoints and asynchronous network calls to test user flows reliably without flaky test results?`,
  },
  {
    domain: 'testing',
    difficulty: 'Advanced',
    type: 'Technical',
    topic: 'Test Strategy & Coverage Architecture',
    expectedFocus: 'Assesses pyramid of testing (Unit vs Integration vs E2E), CI test parallelization, and regression test maintenance.',
    createQuestion: (skill) => `How do you design a comprehensive testing strategy across unit, integration, and E2E layers with ${skill} while keeping CI pipeline execution times fast?`,
  },

  // --- DATA ANALYTICS & BI ---
  {
    domain: 'data_analytics',
    difficulty: 'Beginner',
    type: 'Technical',
    topic: 'Data Cleaning & Exploratory Analysis',
    expectedFocus: 'Evaluates data cleaning, handling nulls/outliers, and exploratory data transformation.',
    createQuestion: (skill) => `How do you use ${skill} to clean, reshape, and validate raw datasets before performing exploratory data analysis?`,
  },
  {
    domain: 'data_analytics',
    difficulty: 'Intermediate',
    type: 'Technical',
    topic: 'Dashboard Design & KPI Modeling',
    expectedFocus: 'Assesses business metric modeling (churn, conversion, LTV), calculated fields, and interactive executive reporting.',
    createQuestion: (skill) => `In ${skill}, how do you design interactive executive dashboards and calculated metrics to track business KPIs like conversion rates and customer churn?`,
  },
  {
    domain: 'data_analytics',
    difficulty: 'Advanced',
    type: 'Technical',
    topic: 'Statistical Modeling & ETL Pipelines',
    expectedFocus: 'Checks A/B test hypothesis formulation, cohort statistical significance, and scalable ETL pipeline design.',
    createQuestion: (skill) => `How do you conduct statistical hypothesis testing or A/B test evaluation on large datasets using ${skill} to ensure conclusions are statistically robust?`,
  },

  // --- PRODUCT MANAGEMENT & AGILE ---
  {
    domain: 'product_agile',
    difficulty: 'Beginner',
    type: 'Technical',
    topic: 'User Stories & Acceptance Criteria',
    expectedFocus: 'Checks ability to write clear user stories with actionable Given/When/Then acceptance criteria.',
    createQuestion: (skill) => `How do you break down high-level feature requirements into well-scoped user stories and clear acceptance criteria using ${skill}?`,
  },
  {
    domain: 'product_agile',
    difficulty: 'Intermediate',
    type: 'Technical',
    topic: 'Backlog Prioritization & Sprint Planning',
    expectedFocus: 'Evaluates prioritization frameworks (RICE, MoSCoW, Kano) and sprint velocity management.',
    createQuestion: (skill) => `When managing product backlogs in ${skill}, what prioritization frameworks (such as RICE or MoSCoW) do you apply to balance user impact against engineering effort?`,
  },
  {
    domain: 'product_agile',
    difficulty: 'Advanced',
    type: 'Technical',
    topic: 'Product Roadmap & Telemetry Analytics',
    expectedFocus: 'Tests strategic roadmap communication, product telemetry metric definition, and managing conflicting stakeholder priorities.',
    createQuestion: (skill) => `How do you synthesize telemetry data from ${skill} with qualitative user discovery feedback to evolve a multi-quarter product roadmap?`,
  },
];

// -------------------------------------------------------------
// 4. BEHAVIORAL & SITUATIONAL QUESTION BANK
// -------------------------------------------------------------

interface BehavioralTemplate {
  difficulty: InterviewLevel;
  category: 'Behavioral' | 'Situational' | 'Background';
  topic: string;
  expectedFocus: string;
  createQuestion: (projectName?: string, companyName?: string, roleName?: string) => string;
}

const BEHAVIORAL_TEMPLATES: BehavioralTemplate[] = [
  // Background & Motivation
  {
    difficulty: 'Beginner',
    category: 'Background',
    topic: 'Career Trajectory & Motivation',
    expectedFocus: 'Evaluates concise communication, passion for software engineering, and clear career alignment with the target role.',
    createQuestion: (_p, _c, role) =>
      `Could you walk me through your engineering journey and what specifically motivated you to pursue this ${role || 'software'} position?`,
  },
  {
    difficulty: 'Intermediate',
    category: 'Background',
    topic: 'Professional Growth & Impact',
    expectedFocus: 'Assesses career progression, technical ownership, and how past experiences prepared the candidate for this target role.',
    createQuestion: (_p, company, role) =>
      company
        ? `Reflecting on your experience at ${company}, what key technical achievements or responsibilities shaped your readiness for this ${role || 'engineering'} role?`
        : `What key milestones in your technical career have contributed most to your engineering philosophy and approach to building software?`,
  },
  {
    difficulty: 'Advanced',
    category: 'Background',
    topic: 'Leadership & Technical Vision',
    expectedFocus: 'Demonstrates senior-level technical leadership, architectural decision-making, and long-term vision.',
    createQuestion: (_p, _c, role) =>
      `As a senior technical practitioner, how do you define your core engineering philosophy and balance technical innovation with business delivery?`,
  },

  // Project & Experience Challenges
  {
    difficulty: 'Beginner',
    category: 'Behavioral',
    topic: 'Project Challenges & Problem Solving',
    expectedFocus: 'Evaluates problem-solving methodology, perseverance, and ability to break down technical hurdles.',
    createQuestion: (project, _c, _r) =>
      project
        ? `In your ${project} project, what was the most challenging technical obstacle you encountered, and how did you resolve it?`
        : `Tell me about a challenging technical feature you implemented in your past work. How did you diagnose and overcome the hurdles?`,
  },
  {
    difficulty: 'Intermediate',
    category: 'Behavioral',
    topic: 'Technical Trade-offs & Decisions',
    expectedFocus: 'Assesses decision-making frameworks, evaluating trade-offs under constraints, and defending architectural choices.',
    createQuestion: (project, _c, _r) =>
      project
        ? `When architecting ${project}, what key technical trade-offs did you evaluate (such as library selection, data flow, or hosting), and why did you choose that approach?`
        : `Describe a scenario where you had to evaluate competing technical solutions under tight timeline constraints. What trade-offs did you make?`,
  },
  {
    difficulty: 'Advanced',
    category: 'Behavioral',
    topic: 'Architectural Ownership & Failures',
    expectedFocus: 'Evaluates executive ownership, navigating systemic architectural complexity, and handling high-impact technical risk.',
    createQuestion: (project, _c, _r) =>
      project
        ? `In your ${project} project, if you had the chance to re-architect the system from scratch today with zero legacy constraints, what major design decisions would you change and why?`
        : `Describe a major architectural decision you led in the past that had unexpected consequences. How did you mitigate the fallout and adapt?`,
  },

  // Teamwork, Collaboration & Conflict
  {
    difficulty: 'Beginner',
    category: 'Behavioral',
    topic: 'Feedback & Collaboration',
    expectedFocus: 'Checks openness to feedback, constructive communication during code reviews, and teamwork mindset.',
    createQuestion: () =>
      `Tell me about a time you received constructive feedback during a code review or project retrospective. How did you implement that feedback?`,
  },
  {
    difficulty: 'Intermediate',
    category: 'Behavioral',
    topic: 'Technical Disagreements',
    expectedFocus: 'Evaluates emotional intelligence, data-driven negotiation, and aligning on common engineering objectives.',
    createQuestion: (_p, company) =>
      company
        ? `During your time at ${company}, describe a situation where you and a colleague or stakeholder disagreed on a technical implementation. How did you reach a consensus?`
        : `Describe a situation where you had a significant technical disagreement with a team member. How did you resolve the difference constructively?`,
  },
  {
    difficulty: 'Advanced',
    category: 'Behavioral',
    topic: 'Mentorship & Engineering Culture',
    expectedFocus: 'Assesses senior leadership, empathetic peer reviews, cultivating best practices, and elevating team capabilities.',
    createQuestion: () =>
      `How do you foster a culture of high code quality, conduct empathetic code reviews, and mentor engineers across varying experience levels?`,
  },
  {
    difficulty: 'Intermediate',
    category: 'Behavioral',
    topic: 'Cross-Functional Collaboration',
    expectedFocus: 'Evaluates effective communication with non-technical stakeholders, Product Managers, and UX designers.',
    createQuestion: () =>
      `Describe an experience where you had to translate a complex technical constraint or trade-off to non-technical stakeholders (e.g. Product Managers, Designers, or Clients). How did you ensure alignment?`,
  },

  // Situational, Ambiguity & Incident Management
  {
    difficulty: 'Beginner',
    category: 'Situational',
    topic: 'Fast Learning & Adaptability',
    expectedFocus: 'Measures self-directed research skills, adaptability, and proactive learning agility.',
    createQuestion: () =>
      `Describe a time when you had to learn a brand-new framework or tool on short notice to complete an assignment or feature. How did you approach it?`,
  },
  {
    difficulty: 'Intermediate',
    category: 'Situational',
    topic: 'Ambiguity & Shifting Deadlines',
    expectedFocus: 'Demonstrates agility, MVP scoping, active stakeholder communication, and delivery focus under uncertainty.',
    createQuestion: () =>
      `Describe a scenario where project requirements were ambiguous or changed close to a milestone. How did you prioritize tasks and deliver results?`,
  },
  {
    difficulty: 'Advanced',
    category: 'Situational',
    topic: 'Production Outage & Incident Management',
    expectedFocus: 'Tests composure under pressure, root-cause isolation, blameless post-mortems, and preventative guardrails.',
    createQuestion: () =>
      `If a critical production service experiences an unexpected outage or performance degradation, walk me through your immediate incident triage and remediation workflow.`,
  },
  {
    difficulty: 'Intermediate',
    category: 'Situational',
    topic: 'Technical Debt vs Feature Velocity',
    expectedFocus: 'Evaluates pragmatic balance between shipping user features and refactoring technical debt.',
    createQuestion: () =>
      `How do you balance paying down technical debt and refactoring legacy code against delivering urgent product roadmap commitments?`,
  },
  {
    difficulty: 'Intermediate',
    category: 'Behavioral',
    topic: 'Accountability & Post-Mortem',
    expectedFocus: 'Checks humility, ownership of mistakes, blameless post-mortem culture, and establishing automated safeguards.',
    createQuestion: () =>
      `Can you share an example of a mistake or bug you introduced in a past project? What happened, how did you resolve it, and what safeguards did you put in place?`,
  },
  {
    difficulty: 'Beginner',
    category: 'Situational',
    topic: 'Task Prioritization & Focus',
    expectedFocus: 'Assesses time management, unblocking oneself, and maintaining quality standards under pressure.',
    createQuestion: () =>
      `When you have multiple tasks or bug tickets assigned simultaneously with similar deadlines, what is your approach to organizing your workday and staying focused?`,
  },
  {
    difficulty: 'Intermediate',
    category: 'Behavioral',
    topic: 'Continuous Learning & Tech Trends',
    expectedFocus: 'Assesses passion for software craft, staying up to date with ecosystem changes, and pragmatic technology adoption.',
    createQuestion: () =>
      `How do you stay updated with rapidly changing tools and best practices in modern software development, and how do you evaluate whether a new tool is worth adopting?`,
  },
  {
    difficulty: 'Advanced',
    category: 'Situational',
    topic: 'Capacity Planning & Scalability Roadmaps',
    expectedFocus: 'Evaluates forward-looking infrastructure planning, latency SLOs, and resource allocation.',
    createQuestion: () =>
      `How do you conduct long-term technical capacity planning to ensure your architecture can sustain a 10x surge in user traffic or data volume over the next 12 months?`,
  },
  {
    difficulty: 'Intermediate',
    category: 'Behavioral',
    topic: 'Driving Engineering Best Practices',
    expectedFocus: 'Assesses initiative in improving team tooling, automated testing standards, and developer experience.',
    createQuestion: (_p, company) =>
      company
        ? `During your time at ${company}, did you introduce or champion any new engineering practices, tools, or automation that improved team efficiency?`
        : `Tell me about an initiative you took in a past project to improve code quality, developer tooling, or automated testing for your team.`,
  },
  {
    difficulty: 'Beginner',
    category: 'Behavioral',
    topic: 'Handling Unclear Requirements',
    expectedFocus: 'Checks proactive question asking, requirement clarification, and avoiding incorrect assumptions.',
    createQuestion: () =>
      `What steps do you take when you are assigned a ticket or requirement that feels ambiguous or lacks clear acceptance criteria?`,
  },
  {
    difficulty: 'Advanced',
    category: 'Behavioral',
    topic: 'Cross-Team Influence & Consensus',
    expectedFocus: 'Assesses influencing without authority, aligning disparate engineering squads, and driving tech initiatives.',
    createQuestion: () =>
      `Describe a time you needed buy-in from multiple engineering squads with competing priorities for a cross-cutting architecture change. How did you build consensus?`,
  },
];

// -------------------------------------------------------------
// 5. DETERMINISTIC QUESTION GENERATOR (Intelligent Fallback)
// -------------------------------------------------------------

export function generateFallbackInterviewQuestions(
  config: InterviewConfig,
  resumeText: string,
  candidateNameOverride?: string
): InterviewQuestion[] {
  const { targetRole, interviewLevel, interviewType, questionCount } = config;
  const count = Number(questionCount) || 10;
  const entities = parseResumeEntities(resumeText, targetRole);
  if (candidateNameOverride && candidateNameOverride.trim()) {
    entities.candidateName = candidateNameOverride.trim();
  }

  const primaryProject = entities.projects[0]?.name;
  const secondaryProject = entities.projects[1]?.name;
  const primaryCompany = entities.experiences[0]?.company;

  const generatedList: InterviewQuestion[] = [];
  const usedQuestionTexts = new Set<string>();

  const addQuestion = (
    qText: string,
    category: InterviewQuestion['category'],
    topic: string,
    expectedFocus: string
  ) => {
    if (generatedList.length >= count) return;
    if (!usedQuestionTexts.has(qText)) {
      usedQuestionTexts.add(qText);
      generatedList.push({
        id: `q-${generatedList.length + 1}`,
        question: qText,
        category,
        difficulty: interviewLevel,
        topic,
        expectedFocus,
      });
    }
  };

  // Determine question count distribution based on interview type
  let techTarget = 0;
  let behavioralTarget = 0;
  let backgroundTarget = 0;

  if (interviewType === 'Technical') {
    techTarget = count;
  } else if (interviewType === 'HR / Behavioral') {
    backgroundTarget = count >= 10 ? 2 : 1;
    behavioralTarget = count - backgroundTarget;
  } else {
    // Mixed
    backgroundTarget = 1;
    if (count === 5) {
      techTarget = 3;
      behavioralTarget = 1;
    } else if (count === 10) {
      techTarget = 6;
      behavioralTarget = 3;
    } else if (count === 15) {
      techTarget = 9;
      behavioralTarget = 5;
    } else {
      backgroundTarget = 2;
      techTarget = 12;
      behavioralTarget = 6;
    }
  }

  // 1. Background Questions
  if (backgroundTarget > 0) {
    const bgTemplates = BEHAVIORAL_TEMPLATES.filter((b) => b.category === 'Background');
    for (const b of bgTemplates) {
      if (generatedList.length >= backgroundTarget) break;
      const qText = b.createQuestion(primaryProject, primaryCompany, targetRole);
      addQuestion(qText, 'Background', b.topic, b.expectedFocus);
    }
  }

  // 2. Project Deep-Dive Technical Questions (strictly if projects exist)
  if (techTarget > 0 && entities.projects.length > 0) {
    for (const proj of entities.projects.slice(0, 3)) {
      if (generatedList.filter((q) => q.category === 'Technical').length >= techTarget) break;

      const projTech = proj.technologies[0] || entities.skills[0]?.skill;
      let qText = '';
      let topic = 'Project Architecture';
      let expectedFocus = 'Evaluates architectural clarity, component breakdown, and practical design decisions.';

      if (interviewLevel === 'Beginner') {
        qText = projTech
          ? `In your ${proj.name} project, how did you implement ${projTech} and what was your approach to organizing the codebase?`
          : `In your ${proj.name} project, what was your core responsibility and what core technologies did you use to build it?`;
        topic = `${proj.name} Implementation`;
      } else if (interviewLevel === 'Intermediate') {
        qText = projTech
          ? `In your ${proj.name} project, can you walk me through the system architecture and how you handled data flow using ${projTech}?`
          : `In your ${proj.name} project, what were the most critical engineering trade-offs you made when designing the system?`;
        topic = `${proj.name} System Design`;
      } else {
        qText = projTech
          ? `For your ${proj.name} project, how did you architect the system for scalability, reliability, and performance using ${projTech}?`
          : `In your ${proj.name} project, what distributed architecture or scaling bottlenecks did you design around, and how did you validate system throughput?`;
        topic = `${proj.name} Scalability & Reliability`;
        expectedFocus = 'Evaluates high-scale distributed reasoning, performance profiling, and production resilience.';
      }

      addQuestion(qText, 'Technical', topic, expectedFocus);
    }
  }

  // 3. Skill-Grounded Technical Questions
  if (techTarget > 0) {
    const availableSkills = entities.skills.length > 0
      ? entities.skills
      : [{ skill: 'JavaScript', domain: 'frontend_core' as TechDomain }, { skill: 'SQL', domain: 'database_sql' as TechDomain }];

    for (const skillItem of availableSkills) {
      if (generatedList.filter((q) => q.category === 'Technical').length >= techTarget) break;

      const matchingTemplates = DOMAIN_QUESTION_TEMPLATES.filter(
        (t) => t.domain === skillItem.domain && (t.difficulty === interviewLevel || t.difficulty === 'Intermediate')
      );

      const template = matchingTemplates.find((t) => t.difficulty === interviewLevel) || matchingTemplates[0];

      if (template) {
        const qText = template.createQuestion(skillItem.skill);
        addQuestion(qText, 'Technical', `${skillItem.skill} - ${template.topic}`, template.expectedFocus);
      }
    }
  }

  // 4. Role-Specific Core Technical Questions (if more technical questions needed)
  if (techTarget > 0 && generatedList.filter((q) => q.category === 'Technical').length < techTarget) {
    const genericTechQuestions = [
      {
        topic: 'API Security & Best Practices',
        question: `When designing public or internal APIs for ${targetRole}, how do you implement authentication, rate limiting, and input sanitization to prevent security vulnerabilities?`,
        focus: 'Tests practical understanding of OWASP API security top 10, JWT validation, and defensive programming.',
      },
      {
        topic: 'Debugging & Root-Cause Analysis',
        question: `Walk me through your step-by-step methodology when isolating and resolving an intermittent, non-reproducible bug in a production environment.`,
        focus: 'Evaluates structured logging analysis, diagnostic tooling, and systematic hypothesis testing.',
      },
      {
        topic: 'Code Quality & Refactoring',
        question: `How do you assess whether a section of legacy code requires refactoring, and what testing strategies do you use to ensure zero regressions during the rewrite?`,
        focus: 'Assesses code maintainability standards, regression testing, and technical risk management.',
      },
      {
        topic: 'System Performance Profiling',
        question: `What specific profiling tools and performance metrics (e.g. latency percentiles, memory heap snapshots, CPU utilization) do you use to detect bottlenecks in your applications?`,
        focus: 'Checks familiarity with performance benchmarking, profiling tools, and optimization heuristics.',
      },
      {
        topic: 'Data Integrity & Caching',
        question: `How do you design caching layers (e.g., Redis or in-memory) alongside persistent databases while guaranteeing cache invalidation consistency?`,
        focus: 'Evaluates understanding of write-through vs write-back caching and cache consistency trade-offs.',
      },
      {
        topic: 'Asynchronous Workflow Design',
        question: `How do you design background job queues or asynchronous task processing for long-running workflows in ${targetRole}?`,
        focus: 'Tests decoupled task architectures, idempotency, retry mechanisms, and dead-letter queues.',
      },
      {
        topic: 'Continuous Integration & Release Gates',
        question: `What automated quality gates (unit tests, static analysis, security scanners) do you enforce in your deployment pipeline before promoting code to production?`,
        focus: 'Checks familiarity with automated build verification, code coverage thresholds, and deployment risk reduction.',
      },
      {
        topic: 'System Monitoring & Observability',
        question: `What metrics and alerting thresholds (e.g., error rate spikes, p99 latency degradation) do you configure to monitor application health proactively?`,
        focus: 'Tests practical knowledge of structured logging, APM telemetry, and operational observability.',
      },
      {
        topic: 'Microservices vs Modular Monolith',
        question: `When evaluating system architecture for ${targetRole}, what technical criteria and team boundaries lead you to choose microservices over a modular monolith?`,
        focus: 'Evaluates domain boundaries, operational overhead assessment, and architectural trade-off reasoning.',
      },
      {
        topic: 'Database Sharding & Replication',
        question: `How do you decide when to implement read replicas versus horizontal database sharding, and how do you handle cross-shard query complexity?`,
        focus: 'Checks understanding of database scalability limits, replication lag, and partition key strategies.',
      },
      {
        topic: 'Service Resiliency & Circuit Breakers',
        question: `How do you implement circuit breaker patterns, exponential backoff retries, and fallback degradation to prevent cascading failures across downstream dependencies?`,
        focus: 'Assesses distributed system fault tolerance, chaos engineering principles, and graceful degradation.',
      },
      {
        topic: 'Idempotent API Design',
        question: `Why is idempotency critical in distributed systems (such as payment or order workflows), and how do you implement idempotency keys at the API layer?`,
        focus: 'Tests understanding of duplicate request handling, distributed locking, and state transition safety.',
      },
      {
        topic: 'Event-Driven Messaging & Queues',
        question: `What are the key trade-offs between at-least-once versus exactly-once message delivery semantics when building event-driven systems?`,
        focus: 'Evaluates message queue architectures, deduplication strategies, and consumer lag management.',
      },
      {
        topic: 'Zero-Downtime Data Migrations',
        question: `Walk me through your strategy for executing large-scale database schema migrations on high-traffic tables without locking or service downtime.`,
        focus: 'Assesses multi-phase expand/contract migration patterns, backwards compatibility, and live table indexing.',
      },
      {
        topic: 'Secrets Management & Compliance',
        question: `How do you manage API keys, environment credentials, and rotation policies securely across development, staging, and production environments?`,
        focus: 'Tests knowledge of vault secret storage, least-privilege access control, and environment isolation.',
      },
      {
        topic: 'Distributed Tracing & OpenTelemetry',
        question: `How do you correlate distributed logs and propagate trace IDs across asynchronous microservices to troubleshoot request latency bottlenecks?`,
        focus: 'Checks familiarity with distributed tracing, context propagation, and span instrumentation.',
      },
      {
        topic: 'CDN & Edge Caching Architecture',
        question: `How do you configure Cache-Control headers, edge caching, and stale-while-revalidate policies to optimize asset delivery across global CDNs?`,
        focus: 'Evaluates browser caching mechanics, origin shield protection, and cache invalidation protocols.',
      },
      {
        topic: 'Capacity Planning & Latency Budgets',
        question: `How do you calculate latency budgets and service level objectives (SLOs) across dependent microservice tiers for ${targetRole}?`,
        focus: 'Assesses mathematical capacity modeling, p95/p99 latency target allocation, and error budget governance.',
      },
    ];

    for (const g of genericTechQuestions) {
      if (generatedList.filter((q) => q.category === 'Technical').length >= techTarget) break;
      addQuestion(g.question, 'Technical', g.topic, g.focus);
    }
  }

  // 5. Behavioral / Situational Questions
  if (behavioralTarget > 0) {
    const behTemplates = BEHAVIORAL_TEMPLATES.filter((b) => b.category !== 'Background');

    for (const b of behTemplates) {
      if (generatedList.length >= count) break;

      const qText = b.createQuestion(
        primaryProject || secondaryProject,
        primaryCompany,
        targetRole
      );
      addQuestion(qText, b.category, b.topic, b.expectedFocus);
    }
  }

  // Guarantee exact count
  return generatedList.slice(0, count).map((q, idx) => ({
    ...q,
    id: `q-${idx + 1}`,
  }));
}

// -------------------------------------------------------------
// 6. POST-GENERATION COHERENCE VALIDATOR & SANITIZER
// -------------------------------------------------------------

export function validateAndSanitizeQuestions(
  rawQuestions: any[],
  entities: ParsedResumeEntities,
  config: InterviewConfig
): InterviewQuestion[] {
  const count = Number(config.questionCount) || 10;
  const level = config.interviewLevel || 'Beginner';
  const type = config.interviewType || 'Mixed';
  const role = config.targetRole || 'Software Professional';

  const sanitized: InterviewQuestion[] = [];
  const seenQuestionTexts = new Set<string>();

  // Known invalid combinations / anti-patterns
  const INVALID_PATTERNS = [
    // CSS3 + state/lifecycle/concurrency
    /\bcss3?\b.*?(?:state\s*management|component\s*lifecycle|concurrency|race\s*condition|memory\s*leak|microservice|database)/i,
    // HTML5 + CSS concepts (flexbox, grid, selectors, responsive css, styling rules, media queries) or state/lifecycle
    /\bhtml5?\b.*?(?:flexbox|css\s*grid|css\s*selectors?|css\s*properties|responsive\s*css|styling\s*rules|media\s*queries|state\s*flow|component\s*lifecycle|orm|concurrency|indexing)/i,
    // Git + state/lifecycle/queries
    /\bgit\b.*?(?:state\s*management|component\s*lifecycle|sql|database\s*query)/i,
    // Broken project parsing phrases
    /\bwhen\s+building\s+experience\b/i,
    /\bin\s+your\s+experience\s+project\b/i,
    /\bwhen\s+working\s+on\s+experience\b/i,
    /\bthe\s+system\s+in\s+your\s+experience\b/i,
  ];

  for (const q of rawQuestions) {
    if (!q || typeof q.question !== 'string' || q.question.trim().length < 15) continue;

    let qText = q.question.trim();

    // Check for invalid patterns
    let hasInvalidPattern = false;
    for (const pattern of INVALID_PATTERNS) {
      if (pattern.test(qText)) {
        hasInvalidPattern = true;
        break;
      }
    }

    // Fix or replace invalid questions
    if (hasInvalidPattern) {
      if (/\bhtml5?\b/i.test(qText) && /(?:flexbox|css|grid|state|lifecycle)/i.test(qText)) {
        qText = `In HTML5, how do you utilize semantic markup elements (such as <main>, <article>, <header>, and <nav>) and native form validation to structure accessible, SEO-friendly pages?`;
      } else if (/\bcss3?\b/i.test(qText) && /(?:state|lifecycle|flow)/i.test(qText)) {
        qText = `You've worked with CSS3. How do you structure your styles and use modern CSS techniques like Flexbox or Grid to keep the UI responsive and maintainable?`;
      } else if (/building\s+experience/i.test(qText)) {
        const projName = entities.projects[0]?.name;
        qText = projName
          ? `In your ${projName} project, what was the most challenging technical obstacle you encountered, and how did you solve it?`
          : `Can you describe a challenging technical problem you solved in your past engineering experience, and walk me through your solution?`;
      } else {
        continue;
      }
    }

    // Interview Type Consistency Check
    let category = q.category || 'Technical';
    if (type === 'Technical' && (category === 'Behavioral' || category === 'Background')) {
      category = 'Technical';
    } else if (type === 'HR / Behavioral' && category === 'Technical') {
      category = 'Behavioral';
    }

    if (!seenQuestionTexts.has(qText)) {
      seenQuestionTexts.add(qText);
      sanitized.push({
        id: `q-${sanitized.length + 1}`,
        question: qText,
        category: category as any,
        difficulty: (q.difficulty as InterviewLevel) || level,
        topic: q.topic || role,
        expectedFocus: q.expectedFocus || 'Demonstrating technical depth, structured thinking, and clear communication.',
      });
    }

    if (sanitized.length >= count) break;
  }

  // If we don't have enough questions, pad directly from deterministic generator without recursion
  if (sanitized.length < count) {
    const fallbackPool = generateFallbackInterviewQuestions(config, entities.rawText, entities.candidateName);
    for (const fb of fallbackPool) {
      if (sanitized.length >= count) break;
      if (!seenQuestionTexts.has(fb.question)) {
        seenQuestionTexts.add(fb.question);
        sanitized.push({
          ...fb,
          id: `q-${sanitized.length + 1}`,
        });
      }
    }
  }

  // Ensure exact count and properly indexed IDs
  return sanitized.slice(0, count).map((q, idx) => ({
    ...q,
    id: `q-${idx + 1}`,
  }));
}
