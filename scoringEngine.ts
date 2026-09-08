// scoringEngine.ts
//
// PURPOSE:
// Code-based, deterministic ATS scoring engine with role-aware skill & keyword taxonomy.
// Ensures consistent, reproducible scores for any given resume and target role.
// Eliminates score jumping between fallback and live modes, and accurately differentiates
// scores across different career roles (e.g. Full Stack Developer vs. Data Scientist).

export interface SectionScores {
  formatting: number;
  keywords: number;
  experienceImpact: number;
  skillsMatch: number;
  readability: number;
}

export interface ScoringInput {
  resumeText: string;
  targetRole?: string;
  jobDescription?: string;
  skillsFound?: string[];
}

export interface RoleProfile {
  id: string;
  title: string;
  aliases: string[];
  requiredSkills: string[];
  recommendedSkills: string[];
  keywords: string[];
  certifications: Array<{ name: string; provider: string; relevance: string }>;
  projects: Array<{ title: string; description: string; techStack: string[]; difficulty: string }>;
}

export interface SkillCategoryResult {
  category: string;
  skills: string[];
}

export interface MissingSkillResult {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
}

export interface GrammarSuggestionResult {
  originalText: string;
  suggestion: string;
  reason: string;
}

export const ROLE_TAXONOMY: Record<string, RoleProfile> = {
  'full-stack': {
    id: 'full-stack',
    title: 'Full Stack Software Engineer',
    aliases: ['full stack', 'fullstack', 'software engineer', 'web developer', 'full stack developer', 'software developer', 'application developer'],
    requiredSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'REST APIs', 'Git', 'HTML5', 'CSS3'],
    recommendedSkills: ['Docker', 'AWS', 'PostgreSQL', 'MongoDB', 'Next.js', 'CI/CD', 'GraphQL', 'Jest', 'Tailwind CSS', 'Redis'],
    keywords: ['full-stack', 'frontend', 'backend', 'api', 'microservices', 'database', 'responsive', 'deployment', 'scalability', 'architecture', 'state management', 'unit testing'],
    certifications: [
      { name: 'AWS Certified Developer – Associate', provider: 'Amazon Web Services', relevance: 'Validates cloud backend deployment and serverless architecture expertise.' },
      { name: 'Meta Full-Stack Engineer Certificate', provider: 'Meta / Coursera', relevance: 'Demonstrates end-to-end web application proficiency.' },
    ],
    projects: [
      { title: 'Real-Time Collaborative Workspace', description: 'Build a multi-user collaborative editor with WebSockets, Node.js backend, and React frontend.', techStack: ['React', 'TypeScript', 'Node.js', 'Socket.io', 'PostgreSQL'], difficulty: 'Intermediate' },
      { title: 'Scalable Microservices E-Commerce API', description: 'Design containerized microservices handling authentication, order processing, and Stripe integration.', techStack: ['Node.js', 'Express', 'Docker', 'PostgreSQL', 'Redis'], difficulty: 'Advanced' },
    ],
  },
  'frontend': {
    id: 'frontend',
    title: 'Frontend Developer',
    aliases: ['frontend', 'front end', 'front-end', 'ui engineer', 'web designer', 'client engineer'],
    requiredSkills: ['JavaScript', 'TypeScript', 'React', 'HTML5', 'CSS3', 'Responsive Design', 'Git', 'REST APIs'],
    recommendedSkills: ['Next.js', 'Tailwind CSS', 'Redux', 'Vue', 'Vite', 'Jest', 'UI/UX', 'Accessibility (WCAG)', 'GraphQL', 'Performance Optimization'],
    keywords: ['components', 'dom', 'spa', 'single page application', 'responsive', 'cross-browser', 'lighthouse', 'web performance', 'state management', 'css architecture'],
    certifications: [
      { name: 'Meta Front-End Developer Professional Certificate', provider: 'Meta', relevance: 'Covers modern React component hierarchies, state management, and UX design.' },
      { name: 'Certified Web Accessibility Specialist (WAS)', provider: 'IAAP', relevance: 'High demand for accessible, compliant front-end engineering.' },
    ],
    projects: [
      { title: 'Design System & Component Library', description: 'Create an accessible, themeable UI library published as an npm package with Storybook documentation.', techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Storybook', 'Vite'], difficulty: 'Intermediate' },
      { title: 'Interactive SaaS Dashboard', description: 'Build a high-performance data dashboard with real-time charting, animations, and dark mode.', techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Recharts'], difficulty: 'Intermediate' },
    ],
  },
  'backend': {
    id: 'backend',
    title: 'Backend Developer',
    aliases: ['backend', 'back end', 'back-end', 'api engineer', 'systems engineer', 'server engineer'],
    requiredSkills: ['Node.js', 'Python', 'SQL', 'REST APIs', 'PostgreSQL', 'Database Design', 'Git', 'Microservices'],
    recommendedSkills: ['Docker', 'Redis', 'AWS', 'GraphQL', 'Kafka', 'CI/CD', 'Linux', 'Kubernetes', 'MongoDB', 'Go'],
    keywords: ['backend', 'endpoints', 'queries', 'indexing', 'throughput', 'latency', 'concurrency', 'system design', 'scalability', 'orm', 'authentication', 'rate limiting'],
    certifications: [
      { name: 'AWS Certified Solutions Architect – Associate', provider: 'Amazon Web Services', relevance: 'Proves capability in designing secure, resilient distributed cloud backends.' },
      { name: 'MongoDB Certified Developer Associate', provider: 'MongoDB', relevance: 'Demonstrates deep knowledge in NoSQL document data modeling and indexing.' },
    ],
    projects: [
      { title: 'High-Throughput Event Streaming Pipeline', description: 'Develop an asynchronous event-driven backend utilizing Kafka message queues and Redis caching.', techStack: ['Node.js', 'Kafka', 'Redis', 'PostgreSQL', 'Docker'], difficulty: 'Advanced' },
      { title: 'Secure OAuth2 / RBAC Auth Service', description: 'Construct a standalone authorization service with JWT token rotation, MFA, and rate limiting.', techStack: ['Node.js', 'Express', 'PostgreSQL', 'Jest'], difficulty: 'Intermediate' },
    ],
  },
  'data-scientist': {
    id: 'data-scientist',
    title: 'Data Scientist',
    aliases: ['data scientist', 'data science', 'applied scientist', 'machine learning specialist', 'ml scientist', 'ai researcher'],
    requiredSkills: ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'Scikit-Learn', 'SQL', 'Statistics', 'Data Analysis'],
    recommendedSkills: ['Deep Learning', 'PyTorch', 'TensorFlow', 'Tableau', 'R', 'NLP', 'Data Visualization', 'Big Data', 'Spark', 'A/B Testing'],
    keywords: ['predictive modeling', 'regression', 'classification', 'clustering', 'exploratory data analysis', 'eda', 'feature engineering', 'neural networks', 'statistical analysis', 'hypothesis testing', 'model evaluation', 'precision recall'],
    certifications: [
      { name: 'IBM Data Science Professional Certificate', provider: 'IBM / Coursera', relevance: 'Industry-standard training covering Python, SQL, statistical modeling, and ML pipelines.' },
      { name: 'TensorFlow Developer Certificate', provider: 'Google', relevance: 'Demonstrates hands-on mastery of neural networks and deep learning models.' },
    ],
    projects: [
      { title: 'Customer Churn Prediction Engine', description: 'Build an end-to-end ML classification pipeline with hyperparameter tuning and model explainability using SHAP.', techStack: ['Python', 'Scikit-Learn', 'Pandas', 'XGBoost', 'Streamlit'], difficulty: 'Intermediate' },
      { title: 'NLP Sentiment & Entity Extraction System', description: 'Fine-tune a transformer model for automated customer feedback categorization and trend detection.', techStack: ['Python', 'PyTorch', 'Hugging Face', 'Transformers', 'FastAPI'], difficulty: 'Advanced' },
    ],
  },
  'data-analyst': {
    id: 'data-analyst',
    title: 'Data Analyst & Insights Specialist',
    aliases: ['data analyst', 'bi analyst', 'business intelligence analyst', 'bi developer', 'insights analyst', 'analytics specialist'],
    requiredSkills: ['SQL', 'Python', 'Excel', 'Tableau', 'Data Analysis', 'Data Visualization', 'Reporting', 'Statistics'],
    recommendedSkills: ['Power BI', 'Snowflake', 'BigQuery', 'ETL', 'Pandas', 'PostgreSQL', 'Google Analytics', 'A/B Testing', 'Metabase'],
    keywords: ['business intelligence', 'kpis', 'dashboards', 'cohort analysis', 'funnel analysis', 'churn', 'aggregations', 'queries', 'metrics', 'insights', 'data cleaning', 'pivot tables'],
    certifications: [
      { name: 'Google Data Analytics Professional Certificate', provider: 'Google / Coursera', relevance: 'Comprehensive foundation in SQL querying, spreadsheet analysis, and Tableau dashboards.' },
      { name: 'Microsoft Certified: Power BI Data Analyst Associate', provider: 'Microsoft', relevance: 'Validates industry expertise in BI modeling, DAX expressions, and data visualization.' },
    ],
    projects: [
      { title: 'Executive Revenue & Retention Dashboard', description: 'Create an interactive Tableau dashboard visualizing ARR, MRR, cohort retention, and sales pipeline metrics.', techStack: ['SQL', 'Tableau', 'PostgreSQL', 'Python'], difficulty: 'Intermediate' },
      { title: 'Automated ETL & Reporting Pipeline', description: 'Build a Python automation script extracting warehouse data, transforming KPIs, and publishing automated reports.', techStack: ['Python', 'Pandas', 'SQL', 'Snowflake'], difficulty: 'Intermediate' },
    ],
  },
  'machine-learning': {
    id: 'machine-learning',
    title: 'Machine Learning & AI Engineer',
    aliases: ['machine learning engineer', 'ml engineer', 'ai engineer', 'mlops', 'deep learning engineer', 'nlp engineer'],
    requiredSkills: ['Python', 'PyTorch', 'TensorFlow', 'Machine Learning', 'Deep Learning', 'Scikit-Learn', 'NumPy', 'Git'],
    recommendedSkills: ['MLOps', 'Docker', 'FastAPI', 'Hugging Face', 'Transformers', 'AWS SageMaker', 'Kubernetes', 'Computer Vision', 'NLP', 'Vector Databases'],
    keywords: ['neural networks', 'embeddings', 'fine-tuning', 'inference', 'loss function', 'data pipelines', 'model evaluation', 'transformers', 'vector search', 'llms', 'cuda'],
    certifications: [
      { name: 'DeepLearning.AI Deep Learning Specialization', provider: 'DeepLearning.AI / Coursera', relevance: 'Premier theoretical and practical training in modern deep neural networks.' },
      { name: 'AWS Certified Machine Learning – Specialty', provider: 'Amazon Web Services', relevance: 'Validates production ML pipeline engineering and cloud deployment at scale.' },
    ],
    projects: [
      { title: 'RAG Knowledge Assistant with Vector Search', description: 'Develop a Retrieval-Augmented Generation service using LangChain, embeddings, and vector similarity search.', techStack: ['Python', 'FastAPI', 'PyTorch', 'Pinecone', 'LangChain'], difficulty: 'Advanced' },
      { title: 'Real-Time Edge Computer Vision Pipeline', description: 'Train and optimize a lightweight object detection model with TensorRT for low-latency video stream inference.', techStack: ['Python', 'PyTorch', 'OpenCV', 'Docker'], difficulty: 'Advanced' },
    ],
  },
  'devops': {
    id: 'devops',
    title: 'DevOps & Cloud Engineer',
    aliases: ['devops', 'cloud engineer', 'site reliability engineer', 'sre', 'platform engineer', 'infrastructure engineer'],
    requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform', 'Git', 'Bash'],
    recommendedSkills: ['Azure', 'GCP', 'Ansible', 'Prometheus', 'Grafana', 'Helm', 'Python', 'Networking', 'Nginx', 'IAM Security'],
    keywords: ['infrastructure as code', 'containerization', 'orchestration', 'pipelines', 'uptime', 'automation', 'monitoring', 'scalability', 'load balancing', 'yaml', 'high availability'],
    certifications: [
      { name: 'Certified Kubernetes Administrator (CKA)', provider: 'Linux Foundation / CNCF', relevance: 'Industry gold standard for Kubernetes cluster deployment, networking, and security.' },
      { name: 'AWS Certified Solutions Architect – Professional', provider: 'Amazon Web Services', relevance: 'Proves mastery in multi-tier cloud architectures and disaster recovery.' },
    ],
    projects: [
      { title: 'GitOps Kubernetes Deployment Pipeline', description: 'Deploy an automated GitOps workflow with ArgoCD, Helm charts, and automated canary deployments.', techStack: ['Kubernetes', 'ArgoCD', 'Helm', 'Docker', 'GitHub Actions'], difficulty: 'Advanced' },
      { title: 'Multi-Region Infrastructure as Code with Terraform', description: 'Provision a modular AWS environment with VPCs, ECS clusters, RDS failover, and CloudWatch alarms.', techStack: ['Terraform', 'AWS', 'Docker', 'Bash'], difficulty: 'Intermediate' },
    ],
  },
  'cybersecurity': {
    id: 'cybersecurity',
    title: 'Cybersecurity Analyst',
    aliases: ['cybersecurity', 'security analyst', 'infosec', 'information security', 'soc analyst', 'penetration tester', 'security engineer'],
    requiredSkills: ['Network Security', 'Vulnerability Assessment', 'SIEM', 'Incident Response', 'Firewalls', 'Security Compliance', 'Threat Analysis'],
    recommendedSkills: ['Penetration Testing', 'Wireshark', 'Linux', 'Python', 'Identity & Access Management (IAM)', 'SOC', 'Splunk', 'Cryptography', 'Zero Trust'],
    keywords: ['encryption', 'malware', 'intrusion detection', 'risk assessment', 'zero trust', 'phishing', 'audits', 'cve', 'mitre att&ck', 'packet analysis', 'security policy'],
    certifications: [
      { name: 'CompTIA Security+', provider: 'CompTIA', relevance: 'Industry baseline certification covering threat management, network identity, and cryptography.' },
      { name: 'Certified Information Systems Security Professional (CISSP)', provider: '(ISC)²', relevance: 'World-recognized gold standard for senior cybersecurity architecture and leadership.' },
    ],
    projects: [
      { title: 'Automated Vulnerability Scanner & Alerting Bot', description: 'Develop a Python-based security tool integrating Nmap, CVE databases, and Slack alerts for port anomalies.', techStack: ['Python', 'Nmap', 'Linux', 'Docker'], difficulty: 'Intermediate' },
      { title: 'SIEM Threat Detection Lab with Splunk', description: 'Set up a simulated enterprise network lab and configure custom detection rules for brute-force attacks.', techStack: ['Splunk', 'Wireshark', 'Linux', 'Snort'], difficulty: 'Advanced' },
    ],
  },
  'product-manager': {
    id: 'product-manager',
    title: 'Technical Product Manager',
    aliases: ['product manager', 'product owner', 'pm', 'technical product manager', 'associate product manager', 'group product manager'],
    requiredSkills: ['Product Strategy', 'Roadmap', 'Agile', 'Scrum', 'User Stories', 'PRDs', 'Jira', 'User Research', 'Feature Prioritization'],
    recommendedSkills: ['A/B Testing', 'Product Analytics', 'Figma', 'Mixpanel', 'Amplitude', 'SQL', 'GTM Strategy', 'Stakeholder Management', 'Wireframing'],
    keywords: ['product lifecycle', 'mvp', 'backlog', 'sprints', 'kpis', 'metrics', 'customer discovery', 'cross-functional', 'market analysis', 'user journey', 'acceptance criteria'],
    certifications: [
      { name: 'Certified Scrum Product Owner (CSPO)', provider: 'Scrum Alliance', relevance: 'Validates hands-on proficiency in backlog grooming, sprint planning, and Agile governance.' },
      { name: 'Product Management Certificate', provider: 'Product School', relevance: 'Covers end-to-end SaaS product lifecycle, discovery frameworks, and GTM execution.' },
    ],
    projects: [
      { title: 'Comprehensive SaaS Product Requirement Document (PRD)', description: 'Draft an exhaustive PRD featuring user personas, journey maps, Figma mockups, and telemetry KPIs.', techStack: ['Figma', 'Jira', 'Mixpanel', 'Notion'], difficulty: 'Intermediate' },
      { title: 'Conversion Funnel & Onboarding Optimization Study', description: 'Analyze telemetry event funnels to formulate hypothesis-driven A/B experiments that boost trial activation.', techStack: ['Mixpanel', 'SQL', 'Tableau', 'A/B Testing'], difficulty: 'Intermediate' },
    ],
  },
  'ui-ux': {
    id: 'ui-ux',
    title: 'UI/UX Designer',
    aliases: ['ui/ux', 'ux designer', 'ui designer', 'product designer', 'ux researcher', 'interaction designer'],
    requiredSkills: ['Figma', 'Wireframing', 'Prototyping', 'User Research', 'Usability Testing', 'UI Design', 'Design Systems'],
    recommendedSkills: ['Adobe XD', 'Information Architecture', 'User Personas', 'Responsive Design', 'HTML/CSS Basics', 'Accessibility (WCAG)', 'Interaction Design'],
    keywords: ['mockups', 'user flows', 'visual design', 'typography', 'heuristics', 'design thinking', 'micro-interactions', 'components', 'user experience', 'user interface'],
    certifications: [
      { name: 'Google UX Design Professional Certificate', provider: 'Google / Coursera', relevance: 'Comprehensive training in empathy mapping, wireframing, Figma prototyping, and usability studies.' },
      { name: 'Nielsen Norman Group UX Master Certified', provider: 'NN/g', relevance: 'Premier world-class credential in empirical usability research and UX strategy.' },
    ],
    projects: [
      { title: 'End-to-End Mobile App UX Case Study', description: 'Conduct user research, synthesize personas, create high-fidelity Figma prototypes, and execute usability testing.', techStack: ['Figma', 'Miro', 'Prototyping', 'UserTesting'], difficulty: 'Intermediate' },
      { title: 'Enterprise Accessible Design System', description: 'Construct a comprehensive component library with WCAG AAA contrast compliance and design tokens.', techStack: ['Figma', 'Design Tokens', 'Storybook'], difficulty: 'Advanced' },
    ],
  },
  'mobile': {
    id: 'mobile',
    title: 'Mobile App Developer',
    aliases: ['mobile developer', 'ios developer', 'android developer', 'react native developer', 'flutter developer', 'mobile engineer'],
    requiredSkills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Mobile App Development', 'REST APIs', 'Git', 'UI Layouts'],
    recommendedSkills: ['iOS', 'Android', 'App Store Deployment', 'State Management', 'Firebase', 'Push Notifications', 'TypeScript', 'GraphQL'],
    keywords: ['mobile', 'native', 'offline storage', 'sdk', 'app lifecycle', 'responsive', 'cross-platform', 'xcode', 'android studio', 'mobile ui'],
    certifications: [
      { name: 'Meta Android or iOS Developer Certificate', provider: 'Meta', relevance: 'Covers native mobile app engineering, lifecycle management, and clean architecture.' },
      { name: 'Associate Android Developer', provider: 'Google', relevance: 'Proves core proficiency in building robust, performant Android applications.' },
    ],
    projects: [
      { title: 'Cross-Platform Fitness Tracking App', description: 'Build a mobile app with offline SQLite sync, interactive charts, and push notifications.', techStack: ['React Native', 'TypeScript', 'Firebase', 'Redux'], difficulty: 'Intermediate' },
      { title: 'Native iOS Swift Productivity App', description: 'Develop a SwiftUI application with CoreData persistence, widgets, and Apple HealthKit integration.', techStack: ['Swift', 'SwiftUI', 'CoreData', 'Combine'], difficulty: 'Advanced' },
    ],
  },
  'qa-engineer': {
    id: 'qa-engineer',
    title: 'QA & Test Automation Engineer',
    aliases: ['qa', 'qa engineer', 'test engineer', 'automation engineer', 'sdet', 'software test engineer', 'quality assurance'],
    requiredSkills: ['Test Automation', 'Selenium', 'Cypress', 'Playwright', 'Unit Testing', 'Integration Testing', 'Jest', 'QA Methodologies', 'Bug Tracking'],
    recommendedSkills: ['CI/CD', 'API Testing', 'Postman', 'Python', 'JavaScript', 'SQL', 'Performance Testing', 'JMeter', 'Test Planning'],
    keywords: ['test cases', 'regression testing', 'e2e', 'assertions', 'code coverage', 'quality assurance', 'defect tracking', 'test plans', 'test automation'],
    certifications: [
      { name: 'ISTQB Certified Tester Foundation Level (CTFL)', provider: 'ISTQB', relevance: 'Internationally recognized standard for software testing principles and methodologies.' },
      { name: 'Certified Software Test Automation Specialist', provider: 'IIST', relevance: 'Validates hands-on test scripting, framework design, and CI integration.' },
    ],
    projects: [
      { title: 'End-to-End Test Automation Framework with Playwright', description: 'Construct a scalable CI/CD test automation framework covering cross-browser UI and API suites.', techStack: ['Playwright', 'TypeScript', 'GitHub Actions', 'Jest'], difficulty: 'Intermediate' },
      { title: 'API Performance & Load Testing Suite', description: 'Script automated JMeter / k6 load tests validating backend SLA benchmarks and throughput limits.', techStack: ['k6', 'JavaScript', 'Docker', 'Postman'], difficulty: 'Intermediate' },
    ],
  },
};

export function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s+.#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text).split(' ').filter(Boolean);
}

const STOPWORDS = new Set([
  'the','a','an','and','or','but','with','for','to','of','in','on','at',
  'is','are','be','as','by','this','that','will','you','your','we','our',
  'have','has','from','it','role','job','looking','candidate','strong',
  'experience','years','work','working','team','ability','skills','proficient',
  'knowledge','good','great','including','etc','well','must','need'
]);

/**
 * Finds the closest matching role profile based on targetRole string.
 */
export function getRoleProfile(targetRole: string = ''): RoleProfile {
  const normRole = normalize(targetRole);

  // Exact or alias match
  for (const key of Object.keys(ROLE_TAXONOMY)) {
    const profile = ROLE_TAXONOMY[key];
    if (normRole.includes(profile.id)) return profile;
    for (const alias of profile.aliases) {
      if (normRole.includes(alias) || alias.includes(normRole)) {
        return profile;
      }
    }
  }

  // Token-based similarity match
  const roleTokens = tokenize(targetRole);
  let bestProfile: RoleProfile = ROLE_TAXONOMY['full-stack'];
  let maxScore = 0;

  for (const key of Object.keys(ROLE_TAXONOMY)) {
    const profile = ROLE_TAXONOMY[key];
    let score = 0;
    for (const token of roleTokens) {
      if (STOPWORDS.has(token)) continue;
      for (const alias of profile.aliases) {
        if (alias.includes(token)) score += 2;
      }
      for (const kw of profile.keywords) {
        if (kw.includes(token)) score += 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestProfile = profile;
    }
  }

  return bestProfile;
}

/**
 * Checks if a specific skill is present in the resume text or candidate's detected skills list.
 */
function isSkillMatched(skill: string, resumeTextLower: string, candidateSkillsSet: Set<string>): boolean {
  const normSkill = normalize(skill);
  if (candidateSkillsSet.has(normSkill)) return true;

  // Direct phrase match in resume
  if (resumeTextLower.includes(normSkill)) return true;

  // Keyword alias checks
  if (normSkill === 'node js' || normSkill === 'node.js') {
    return /\bnode(\.js)?\b/.test(resumeTextLower);
  }
  if (normSkill === 'react' || normSkill === 'react js' || normSkill === 'react.js') {
    return /\breact(\.js)?\b/.test(resumeTextLower);
  }
  if (normSkill === 'sql') {
    return /\b(sql|mysql|postgresql|postgres|sqlite|mssql|t-sql)\b/.test(resumeTextLower);
  }
  if (normSkill === 'postgresql' || normSkill === 'postgres') {
    return /\b(postgres|postgresql)\b/.test(resumeTextLower);
  }
  if (normSkill === 'mongodb' || normSkill === 'mongo') {
    return /\b(mongo|mongodb)\b/.test(resumeTextLower);
  }
  if (normSkill === 'python') {
    return /\bpython\b/.test(resumeTextLower);
  }
  if (normSkill === 'docker') {
    return /\bdocker\b/.test(resumeTextLower);
  }
  if (normSkill === 'kubernetes' || normSkill === 'k8s') {
    return /\b(kubernetes|k8s)\b/.test(resumeTextLower);
  }
  if (normSkill === 'aws') {
    return /\b(aws|amazon web services|s3|ec2|lambda|dynamodb)\b/.test(resumeTextLower);
  }
  if (normSkill === 'ci cd' || normSkill === 'ci/cd') {
    return /\b(ci\/cd|ci cd|continuous integration|github actions|gitlab ci|jenkins)\b/.test(resumeTextLower);
  }
  if (normSkill === 'machine learning') {
    return /\b(machine learning|ml|scikit|model training)\b/.test(resumeTextLower);
  }
  if (normSkill === 'deep learning') {
    return /\b(deep learning|neural network|pytorch|tensorflow|keras)\b/.test(resumeTextLower);
  }
  if (normSkill === 'excel') {
    return /\b(excel|spreadsheets|vba|pivot table)\b/.test(resumeTextLower);
  }
  if (normSkill === 'rest apis' || normSkill === 'rest') {
    return /\b(rest|restful|rest api|restful api|endpoints)\b/.test(resumeTextLower);
  }
  if (normSkill === 'git') {
    return /\b(git|github|gitlab|bitbucket)\b/.test(resumeTextLower);
  }
  if (normSkill === 'typescript') {
    return /\b(typescript|ts)\b/.test(resumeTextLower);
  }
  if (normSkill === 'javascript') {
    return /\b(javascript|js|es6)\b/.test(resumeTextLower);
  }
  if (normSkill === 'html5' || normSkill === 'html') {
    return /\bhtml5?\b/.test(resumeTextLower);
  }
  if (normSkill === 'css3' || normSkill === 'css') {
    return /\bcss3?\b/.test(resumeTextLower);
  }
  if (normSkill === 'next.js' || normSkill === 'nextjs') {
    return /\bnext(\.js|js)?\b/.test(resumeTextLower);
  }
  if (normSkill === 'tailwind css' || normSkill === 'tailwind') {
    return /\btailwind(\s*css)?\b/.test(resumeTextLower);
  }
  if (normSkill === 'graphql') {
    return /\bgraphql\b/.test(resumeTextLower);
  }
  if (normSkill === 'redis') {
    return /\bredis\b/.test(resumeTextLower);
  }

  return false;
}

export function extractJDKeywords(jobDescription: string): string[] {
  const tokens = tokenize(jobDescription).filter(
    (t) => t.length > 2 && !STOPWORDS.has(t)
  );
  return Array.from(new Set(tokens));
}

/**
 * Calculates keyword score comparing resume to role requirements and/or job description.
 */
export function calculateKeywordScore(
  resumeText: string,
  targetRole: string = '',
  jobDescription: string = ''
): number {
  const resumeLower = normalize(resumeText);
  const profile = getRoleProfile(targetRole);

  const hasJD = jobDescription && jobDescription.trim().length > 20;

  if (hasJD) {
    const jdKeywords = extractJDKeywords(jobDescription);
    const combinedKeywords = Array.from(new Set([...jdKeywords, ...profile.keywords.map(normalize)]));

    if (combinedKeywords.length === 0) return 70;

    let matched = 0;
    for (const kw of combinedKeywords) {
      if (resumeLower.includes(kw)) matched++;
    }

    const ratio = matched / combinedKeywords.length;
    // Scale ratio: 60%+ coverage gives an excellent score
    const scaled = Math.min(100, Math.round((ratio / 0.55) * 100));
    return Math.max(35, scaled);
  } else {
    // When no JD is provided, evaluate purely against target role keywords
    const roleKeywords = profile.keywords.map(normalize);
    let matched = 0;
    for (const kw of roleKeywords) {
      if (resumeLower.includes(kw)) matched++;
    }

    const ratio = matched / Math.max(1, roleKeywords.length);
    // Scale ratio: matching 60%+ role keywords = 90+
    const scaled = Math.min(100, Math.round((ratio / 0.55) * 100));
    return Math.max(30, Math.min(98, scaled));
  }
}

/**
 * Calculates skill match score comparing candidate's detected skills against target role requirements.
 */
export function calculateSkillsMatchScore(
  skillsFound: string[] = [],
  resumeText: string,
  targetRole: string = '',
  jobDescription: string = ''
): number {
  const resumeLower = normalize(resumeText);
  const profile = getRoleProfile(targetRole);
  const candidateSkillsSet = new Set(skillsFound.map(normalize));

  // Evaluate required skills (High importance)
  let matchedRequired = 0;
  for (const skill of profile.requiredSkills) {
    if (isSkillMatched(skill, resumeLower, candidateSkillsSet)) {
      matchedRequired++;
    }
  }

  // Evaluate recommended skills (Medium importance)
  let matchedRecommended = 0;
  for (const skill of profile.recommendedSkills) {
    if (isSkillMatched(skill, resumeLower, candidateSkillsSet)) {
      matchedRecommended++;
    }
  }

  const requiredRatio = matchedRequired / Math.max(1, profile.requiredSkills.length);
  const recommendedRatio = matchedRecommended / Math.max(1, profile.recommendedSkills.length);

  // Weighted score: 75% required skills coverage + 25% recommended skills coverage
  let score = requiredRatio * 75 + recommendedRatio * 25;

  // If JD is present, also check JD specific match
  if (jobDescription && jobDescription.trim().length > 20) {
    const jdNormalized = normalize(jobDescription);
    let jdSkillMatches = 0;
    const allRoleSkills = [...profile.requiredSkills, ...profile.recommendedSkills];
    const jdSkills = allRoleSkills.filter((s) => jdNormalized.includes(normalize(s)));

    if (jdSkills.length > 0) {
      for (const skill of jdSkills) {
        if (isSkillMatched(skill, resumeLower, candidateSkillsSet)) {
          jdSkillMatches++;
        }
      }
      const jdRatio = jdSkillMatches / jdSkills.length;
      score = score * 0.7 + jdRatio * 100 * 0.3;
    }
  }

  return Math.max(25, Math.min(100, Math.round(score)));
}

export function calculateFormattingScore(resumeText: string): number {
  let score = 100;
  const text = resumeText || '';

  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  if (!hasEmail) score -= 15;

  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(text);
  if (!hasPhone) score -= 10;

  const commonSections = ['experience', 'education', 'skills', 'projects'];
  const lower = text.toLowerCase();
  const sectionsFound = commonSections.filter((s) => lower.includes(s)).length;
  score -= (commonSections.length - sectionsFound) * 8;

  const bulletCount = (text.match(/(^|\n)\s*[•\-*]\s+/g) || []).length;
  if (bulletCount < 3) score -= 10;

  const wordCount = tokenize(text).length;
  if (wordCount < 150) score -= 15;
  if (wordCount > 1200) score -= 10;

  return Math.max(40, Math.min(100, Math.round(score)));
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function calculateReadabilityScore(resumeText: string): number {
  const sentences = (resumeText || '').split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = tokenize(resumeText || '');
  if (sentences.length === 0 || words.length === 0) return 60;

  const avgWordsPerSentence = words.length / sentences.length;
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSyllablesPerWord = totalSyllables / words.length;

  const flesch =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Calibrate for resume technical prose (typically denser than casual writing)
  const calibrated = Math.min(96, Math.max(50, Math.round(flesch + 20)));
  return calibrated;
}

const ACTION_VERBS = [
  'led','built','created','designed','developed','implemented','improved',
  'increased','decreased','reduced','optimized','launched','managed',
  'architected','automated','delivered','achieved','drove','scaled',
  'spearheaded','streamlined','engineered','orchestrated','constructed'
];

export function calculateExperienceImpactScore(resumeText: string): number {
  const lower = (resumeText || '').toLowerCase();

  const quantifiers = (resumeText.match(/\d+%\b|\$\d+|\d+x\b|\b\d{2,}\b|\b\d+\+\b/g) || []).length;
  const quantScore = Math.min(50, quantifiers * 8);

  const verbHits = ACTION_VERBS.filter((v) => lower.includes(v)).length;
  const verbScore = Math.min(50, verbHits * 7);

  const total = quantScore + verbScore;
  return Math.max(35, Math.min(100, Math.round(total)));
}

/**
 * Main function to compute section scores deterministically.
 */
export function computeSectionScores(input: ScoringInput): SectionScores {
  const targetRole = input.targetRole || 'Full Stack Software Engineer';
  const jobDescription = input.jobDescription || '';

  return {
    formatting: calculateFormattingScore(input.resumeText),
    keywords: calculateKeywordScore(input.resumeText, targetRole, jobDescription),
    experienceImpact: calculateExperienceImpactScore(input.resumeText),
    skillsMatch: calculateSkillsMatchScore(input.skillsFound || [], input.resumeText, targetRole, jobDescription),
    readability: calculateReadabilityScore(input.resumeText),
  };
}

/**
 * Calculates final weighted ATS score from section scores.
 */
export function calculateFinalATS(scores: SectionScores): number {
  return Math.round(
    scores.keywords * 0.30 +
    scores.formatting * 0.20 +
    scores.experienceImpact * 0.20 +
    scores.skillsMatch * 0.15 +
    scores.readability * 0.15
  );
}

/**
 * Deterministically extracts categorized skills from resume for both live and fallback analysis.
 * Uses exact role taxonomy matching, deduplication, and deterministic priority/alphabetical sorting.
 */
export function extractCandidateSkillsCategorized(
  resumeText: string,
  targetRole: string = '',
  jobDescription: string = ''
): { skillsFound: SkillCategoryResult[]; missingSkills: MissingSkillResult[] } {
  const profile = getRoleProfile(targetRole);
  const resumeLower = normalize(resumeText);
  const candidateSkillsSet = new Set<string>();

  const coreDetected: string[] = [];
  const toolsDetected: string[] = [];
  const missingSkillsMap = new Map<string, MissingSkillResult>();

  const allRoleSkills = [...profile.requiredSkills, ...profile.recommendedSkills];

  for (const skill of allRoleSkills) {
    if (isSkillMatched(skill, resumeLower, candidateSkillsSet)) {
      if (profile.requiredSkills.includes(skill)) {
        if (!coreDetected.includes(skill)) coreDetected.push(skill);
      } else {
        if (!toolsDetected.includes(skill)) toolsDetected.push(skill);
      }
    }
  }

  // Also check common cross-cutting tech skills
  const commonTech = ['Git', 'REST APIs', 'Docker', 'Linux', 'SQL', 'TypeScript', 'JavaScript', 'Python'];
  for (const skill of commonTech) {
    if (isSkillMatched(skill, resumeLower, candidateSkillsSet)) {
      if (!coreDetected.includes(skill) && !toolsDetected.includes(skill)) {
        toolsDetected.push(skill);
      }
    }
  }

  const detectedSet = new Set([...coreDetected, ...toolsDetected].map(normalize));

  // Check what required skills are missing (High Priority)
  for (const skill of profile.requiredSkills) {
    const norm = normalize(skill);
    if (!detectedSet.has(norm) && !missingSkillsMap.has(norm)) {
      missingSkillsMap.set(norm, {
        skill,
        priority: 'High',
        reason: `Critical requirement for ${profile.title} roles commonly screened by ATS algorithms.`,
      });
    }
  }

  // Check what recommended skills are missing (Medium Priority)
  for (const skill of profile.recommendedSkills) {
    const norm = normalize(skill);
    if (!detectedSet.has(norm) && !missingSkillsMap.has(norm)) {
      missingSkillsMap.set(norm, {
        skill,
        priority: 'Medium',
        reason: `Frequently preferred technology that increases keyword relevance for ${profile.title} openings.`,
      });
    }
  }

  // If JD is present, extract explicit JD technical keywords that are missing
  if (jobDescription && jobDescription.trim().length > 20) {
    const jdKeywords = extractJDKeywords(jobDescription);
    for (const kw of jdKeywords) {
      const norm = normalize(kw);
      if (!detectedSet.has(norm) && !missingSkillsMap.has(norm) && kw.length >= 4 && !STOPWORDS.has(kw)) {
        const capitalized = kw.charAt(0).toUpperCase() + kw.slice(1);
        if (missingSkillsMap.size < 8) {
          missingSkillsMap.set(norm, {
            skill: capitalized,
            priority: 'Medium',
            reason: `Target keyword explicitly required in the provided Job Description.`,
          });
        }
      }
    }
  }

  const missingSkills = Array.from(missingSkillsMap.values());

  // Canonical Deterministic Sorting for Missing Skills:
  // 1. Priority: High -> Medium -> Low
  // 2. Skill name alphabetically
  const priorityOrder: Record<string, number> = { High: 1, Medium: 2, Low: 3 };
  missingSkills.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
    if (pDiff !== 0) return pDiff;
    return a.skill.localeCompare(b.skill);
  });

  // Sort detected skills alphabetically within each category for consistent presentation
  coreDetected.sort((a, b) => a.localeCompare(b));
  toolsDetected.sort((a, b) => a.localeCompare(b));

  const skillsFound: SkillCategoryResult[] = [];
  if (coreDetected.length > 0) {
    skillsFound.push({ category: 'Core Competencies', skills: coreDetected });
  }
  if (toolsDetected.length > 0) {
    skillsFound.push({ category: 'Tools & Technologies', skills: toolsDetected });
  }

  return { skillsFound, missingSkills };
}

/**
 * Deterministically analyzes the candidate's actual resume text for grammar, phrasing,
 * action verb strength, and quantifiable metrics, providing actionable suggestions.
 */
export function analyzeGrammarAndPhrasing(
  resumeText: string,
  _targetRole: string = ''
): GrammarSuggestionResult[] {
  const rawLines = (resumeText || '').split('\n');
  const lines = rawLines
    .map((l) => l.trim())
    .filter((l) => {
      if (l.length < 20 || l.length > 250) return false;
      // Filter out pure contact, URL, and section header lines
      if (/@|http|linkedin\.com|github\.com|phone|\(\d{3}\)/i.test(l)) return false;
      if (/^(summary|experience|skills|education|projects|work experience|technical skills)$/i.test(l)) return false;
      return true;
    });

  const suggestions: GrammarSuggestionResult[] = [];
  const seenOriginals = new Set<string>();

  const addSuggestion = (original: string, suggestion: string, reason: string) => {
    const cleanOriginal = original.replace(/^[-*•\s]+/, '').trim();
    if (seenOriginals.has(cleanOriginal.toLowerCase()) || suggestions.length >= 3) return;
    seenOriginals.add(cleanOriginal.toLowerCase());
    suggestions.push({
      originalText: cleanOriginal,
      suggestion,
      reason,
    });
  };

  // Rule 1: Detect passive / weak responsibility openers (e.g. "Responsible for...", "Was responsible for...")
  for (const line of lines) {
    const clean = line.replace(/^[-*•\s]+/, '').trim();
    const respMatch = clean.match(/^(?:responsible for|was responsible for|is responsible for)\s+(?:the\s+)?(?:developing|building|creating|managing|maintaining|leading|implementing|working on|designing)?\s*(.*)/i);
    if (respMatch) {
      const rest = respMatch[1] && respMatch[1].length > 3
        ? respMatch[1].trim().replace(/[.]+$/, '')
        : 'core project modules and deliverables';
      const action = clean.toLowerCase().includes('backend') || clean.toLowerCase().includes('api')
        ? 'Architected and engineered scalable'
        : clean.toLowerCase().includes('frontend') || clean.toLowerCase().includes('ui')
        ? 'Engineered responsive and high-performance'
        : clean.toLowerCase().includes('data')
        ? 'Synthesized and analyzed high-volume'
        : 'Spearheaded and delivered enterprise-grade';
      addSuggestion(
        clean,
        `${action} ${rest.replace(/^[a-z]/, (c) => c.toLowerCase())}, ensuring 99.9% uptime and streamlined delivery.`,
        'Replace passive duty-oriented statements with decisive, ownership-driven action verbs.'
      );
    }
  }

  // Rule 2: Detect collaborative ambiguity (e.g. "Helped with...", "Worked on...", "Assisted in...", "Collaborated with...")
  for (const line of lines) {
    const clean = line.replace(/^[-*•\s]+/, '').trim();
    const helpMatch = clean.match(/^(?:helped with|assisted with|assisted in|helped to|worked on|tasked with|involved in|participated in)\s+(.*)/i);
    if (helpMatch) {
      const rest = helpMatch[1].trim().replace(/[.]+$/, '');
      addSuggestion(
        clean,
        `Architected, implemented, and optimized ${rest.replace(/^[a-z]/, (c) => c.toLowerCase())} across cross-functional teams.`,
        'Eliminate vague collaborative phrasing to highlight individual technical contribution and leadership.'
      );
    } else if (/^collaborated with\s+(.*)/i.test(clean)) {
      const rest = clean.replace(/^collaborated with\s+/i, '').trim().replace(/[.]+$/, '');
      addSuggestion(
        clean,
        `Spearheaded cross-functional collaboration with ${rest.replace(/^[a-z]/, (c) => c.toLowerCase())}, accelerating sprint velocity.`,
        'Position collaborative achievements around proactive technical leadership and measurable outcomes.'
      );
    }
  }

  // Rule 3: Detect informal / weak verbs (e.g. "Handled...", "Did...", "Took care of...")
  for (const line of lines) {
    const clean = line.replace(/^[-*•\s]+/, '').trim();
    const handledMatch = clean.match(/^(?:handled|did|took care of)\s+(.*)/i);
    if (handledMatch) {
      const rest = handledMatch[1].trim().replace(/[.]+$/, '');
      addSuggestion(
        clean,
        `Orchestrated and managed ${rest.replace(/^[a-z]/, (c) => c.toLowerCase())}, improving workflow throughput and quality.`,
        'Upgrade informal action verbs to industry-standard technical terminology.'
      );
    }
  }

  // Rule 4: Action verbs without metrics (Google XYZ formula enhancement)
  if (suggestions.length < 3) {
    for (const line of lines) {
      const clean = line.replace(/^[-*•\s]+/, '').trim();
      const startsWithAction = /^(?:Led|Built|Created|Designed|Developed|Implemented|Optimized|Launched|Engineered|Architected|Constructed|Automated)\b/i.test(clean);
      const hasMetrics = /\d+%|\$\d+|\d+x|\b\d{2,}\b|\b\d+\+/i.test(clean);
      if (startsWithAction && !hasMetrics && clean.length >= 35 && clean.length <= 150) {
        const withoutPeriod = clean.replace(/[.]+$/, '');
        addSuggestion(
          clean,
          `${withoutPeriod}, achieving a 25% efficiency gain and accelerating deployment cycles.`,
          'Incorporate quantifiable metrics using Google’s X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]".'
        );
        break;
      }
    }
  }

  // Rule 5: Wordiness / filler phrase reduction
  if (suggestions.length < 3) {
    for (const line of lines) {
      const clean = line.replace(/^[-*•\s]+/, '').trim();
      if (/in order to/i.test(clean)) {
        addSuggestion(
          clean,
          clean.replace(/in order to/gi, 'to'),
          'Eliminate wordy filler phrases like "in order to" -> "to" for crisp, impactful ATS readability.'
        );
      } else if (/due to the fact that/i.test(clean)) {
        addSuggestion(
          clean,
          clean.replace(/due to the fact that/gi, 'because'),
          'Replace "due to the fact that" with "because" to improve sentence cadence and conciseness.'
        );
      }
    }
  }

  // Fallback: Use real bullet points from work experience / projects
  if (suggestions.length === 0 && lines.length > 0) {
    const bulletLine = lines.find((l) => /^[•\-*]/.test(l) || /^(Developed|Built|Engineered|Led|Designed)/i.test(l)) || lines[0];
    const clean = bulletLine.replace(/^[-*•\s]+/, '').trim();
    addSuggestion(
      clean,
      `${clean.replace(/[.]+$/, '')}, achieving a 30% performance boost and high test coverage.`,
      'Strengthen executive presence by pairing high-impact leadership verbs with measurable business outcomes.'
    );
  }

  return suggestions.slice(0, 3);
}

export {
  computeRecruiterReadiness,
  RECRUITER_READINESS_WEIGHTS,
} from './src/utils/recruiterReadiness';
export type {
  ReadinessCategoryScore,
  RecruiterReadinessLevel,
  RecruiterReadinessResult,
} from './src/utils/recruiterReadiness';
