import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Locale = 'en' | 'fr';

const translations = {
  en: {
    // Landing
    'landing.badge': 'AI-powered travel planning',
    'landing.headline1': 'You discover',
    'landing.headline2': 'the world.',
    'landing.subtitle': 'Curated places for digital nomads — save them, list them, share them.',
    'landing.searchPlaceholder': 'Where do you want to go?',
    'landing.searchHints': 'Try: "7 days in Bali" · "Coworking in Medellín" · "Budget trip to Bangkok"',
    'landing.getStarted': 'Get started',
    'landing.destinations': 'Destinations',
    'landing.valueProp1Title': 'Discover curated spots',
    'landing.valueProp1Desc': 'Hand-picked coworking spaces, cafés, and hidden gems — vetted by real nomads.',
    'landing.valueProp2Title': 'Save & organize',
    'landing.valueProp2Desc': 'Create custom lists by city or vibe. Works offline, always in your pocket.',
    'landing.valueProp3Title': 'Share with your crew',
    'landing.valueProp3Desc': 'Send your favorite spots to friends in one tap. Plan together, travel better.',
    'landing.explorePlaces': 'Explore places',
    'landing.exploreSubtitle': 'Click any spot to get started',
    'landing.ctaTitle': 'Ready to explore?',
    'landing.ctaSubtitle': 'Join thousands of nomads discovering the world\'s best places.',
    'landing.ctaButton': 'Get started — it\'s free',
    'landing.signUp': 'Sign Up',
    // Categories
    'cat.all': 'All',
    'cat.coworking': 'Coworking',
    'cat.cafes': 'Cafés',
    'cat.food': 'Food',
    'cat.explore': 'Explore',
    'cat.coliving': 'Coliving',
    'cat.hostels': 'Hostels',
    // Auth
    'auth.welcome': 'Welcome to nomaaad',
    'auth.subtitle': 'Sign in to save your trips',
    'auth.google': 'Continue with Google',
    'auth.or': 'or',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signingIn': 'Signing in...',
    'auth.createAccount': 'Create Account',
    'auth.creatingAccount': 'Creating account...',
    'auth.checkEmail': 'Check your email',
    'auth.confirmLink': 'We sent you a confirmation link to verify your account.',
    'auth.signInFailed': 'Sign in failed',
    'auth.signUpFailed': 'Sign up failed',
    // Explore
    'explore.greeting': 'Hey, explorer',
    'explore.greetingSub': 'Discover curated places or generate an AI travel plan.',
    'explore.aiPlaceholder': 'Plan 7 days in Lisbon for a digital nomad...',
    'explore.aiTitle': 'AI Travel Plan',
    'explore.generating': 'Generating...',
    'explore.building': 'Building your perfect trip...',
    'explore.filterPlaceholder': 'Filter places, cities...',
    'explore.noPlaces': 'No places found',
    'explore.noPlacesSub': 'Try a different search or category.',
    'explore.saveToList': 'Save to list',
    'explore.noLists': 'No lists yet',
    'explore.createList': 'Create a list',
    'explore.addedToList': 'Added to list',
    'explore.places': 'Places',
    'explore.lists': 'Lists',
    'explore.myLists': 'My Lists',
    'explore.signOut': 'Sign Out',
    // Destinations
    'dest.title': 'Popular destinations',
    'dest.subtitle': 'Pick a city and let our AI plan the perfect trip for you.',
    'dest.searchPlaceholder': 'Search destinations...',
    'dest.noResults': 'No destinations found for',
    'dest.planTrip': 'Plan trip',
    // General
    'lang.toggle': 'FR',
  },
  fr: {
    // Landing
    'landing.badge': 'Planification de voyage par IA',
    'landing.headline1': 'Vous découvrez',
    'landing.headline2': 'le monde.',
    'landing.subtitle': 'Lieux sélectionnés pour les nomades numériques — sauvegardez, organisez, partagez.',
    'landing.searchPlaceholder': 'Où voulez-vous aller ?',
    'landing.searchHints': 'Essayez : "7 jours à Bali" · "Coworking à Medellín" · "Voyage pas cher à Bangkok"',
    'landing.getStarted': 'Commencer',
    'landing.destinations': 'Destinations',
    'landing.valueProp1Title': 'Découvrez des lieux sélectionnés',
    'landing.valueProp1Desc': 'Espaces de coworking, cafés et pépites cachées — validés par de vrais nomades.',
    'landing.valueProp2Title': 'Sauvegardez & organisez',
    'landing.valueProp2Desc': 'Créez des listes par ville ou ambiance. Fonctionne hors-ligne, toujours dans votre poche.',
    'landing.valueProp3Title': 'Partagez avec vos amis',
    'landing.valueProp3Desc': 'Envoyez vos spots favoris en un tap. Planifiez ensemble, voyagez mieux.',
    'landing.explorePlaces': 'Explorer les lieux',
    'landing.exploreSubtitle': 'Cliquez sur un lieu pour commencer',
    'landing.ctaTitle': 'Prêt à explorer ?',
    'landing.ctaSubtitle': 'Rejoignez des milliers de nomades qui découvrent les meilleurs endroits du monde.',
    'landing.ctaButton': 'Commencer — c\'est gratuit',
    'landing.signUp': 'S\'inscrire',
    // Categories
    'cat.all': 'Tout',
    'cat.coworking': 'Coworking',
    'cat.cafes': 'Cafés',
    'cat.food': 'Cuisine',
    'cat.explore': 'Explorer',
    'cat.coliving': 'Coliving',
    'cat.hostels': 'Auberges',
    // Auth
    'auth.welcome': 'Bienvenue sur nomaaad',
    'auth.subtitle': 'Connectez-vous pour sauvegarder vos voyages',
    'auth.google': 'Continuer avec Google',
    'auth.or': 'ou',
    'auth.signIn': 'Se connecter',
    'auth.signUp': 'S\'inscrire',
    'auth.email': 'E-mail',
    'auth.password': 'Mot de passe',
    'auth.signingIn': 'Connexion...',
    'auth.createAccount': 'Créer un compte',
    'auth.creatingAccount': 'Création du compte...',
    'auth.checkEmail': 'Vérifiez votre e-mail',
    'auth.confirmLink': 'Nous vous avons envoyé un lien de confirmation.',
    'auth.signInFailed': 'Échec de la connexion',
    'auth.signUpFailed': 'Échec de l\'inscription',
    // Explore
    'explore.greeting': 'Salut, explorateur',
    'explore.greetingSub': 'Découvrez des lieux ou générez un plan de voyage par IA.',
    'explore.aiPlaceholder': 'Planifier 7 jours à Lisbonne pour un nomade...',
    'explore.aiTitle': 'Plan de voyage IA',
    'explore.generating': 'Génération...',
    'explore.building': 'Création de votre voyage idéal...',
    'explore.filterPlaceholder': 'Filtrer les lieux, villes...',
    'explore.noPlaces': 'Aucun lieu trouvé',
    'explore.noPlacesSub': 'Essayez une autre recherche ou catégorie.',
    'explore.saveToList': 'Ajouter à une liste',
    'explore.noLists': 'Pas encore de listes',
    'explore.createList': 'Créer une liste',
    'explore.addedToList': 'Ajouté à la liste',
    'explore.places': 'Lieux',
    'explore.lists': 'Listes',
    'explore.myLists': 'Mes listes',
    'explore.signOut': 'Déconnexion',
    // Destinations
    'dest.title': 'Destinations populaires',
    'dest.subtitle': 'Choisissez une ville et laissez notre IA planifier le voyage parfait.',
    'dest.searchPlaceholder': 'Rechercher des destinations...',
    'dest.noResults': 'Aucune destination trouvée pour',
    'dest.planTrip': 'Planifier',
    // General
    'lang.toggle': 'EN',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  locale: Locale;
  t: (key: TranslationKey) => string;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('nomaaad_locale');
    return (saved === 'fr' ? 'fr' : 'en') as Locale;
  });

  const toggleLocale = useCallback(() => {
    setLocale(prev => {
      const next = prev === 'en' ? 'fr' : 'en';
      localStorage.setItem('nomaaad_locale', next);
      document.documentElement.lang = next;
      return next;
    });
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[locale][key] || translations.en[key] || key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
