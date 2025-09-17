import Layout from "./Layout.jsx";

import Home from "./Home";

import Quiz from "./Quiz";

import Badges from "./Badges";

import Profile from "./Profile";

import BookSelection from "./BookSelection";

import Leaderboard from "./Leaderboard";

import Admin from "./Admin";

import DuelsLobby from "./DuelsLobby";

import Duel from "./Duel";

import DuelResults from "./DuelResults";

import Friends from "./Friends";

import TournamentLobby from "./TournamentLobby";

import TournamentBracket from "./TournamentBracket";

import VerseMatch from "./VerseMatch";

import Shop from "./Shop";

import CreateTeam from "./CreateTeam";

import TeamHub from "./TeamHub";

import Minigames from "./Minigames";

import VerseJigsaw from "./VerseJigsaw";

import PictureMatch from "./PictureMatch";

import EmojiVerse from "./EmojiVerse";

import BibleBingo from "./BibleBingo";

import WiseWordle from "./WiseWordle";

import TriviaTower from "./TriviaTower";

import CaptureVerseLobby from "./CaptureVerseLobby";

import CaptureVerseGame from "./CaptureVerseGame";

import Settings from "./Settings";

import BibleReader from "./BibleReader";

import BibleChapter from "./BibleChapter";

import BibleFavorites from "./BibleFavorites";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Quiz: Quiz,
    
    Badges: Badges,
    
    Profile: Profile,
    
    BookSelection: BookSelection,
    
    Leaderboard: Leaderboard,
    
    Admin: Admin,
    
    DuelsLobby: DuelsLobby,
    
    Duel: Duel,
    
    DuelResults: DuelResults,
    
    Friends: Friends,
    
    TournamentLobby: TournamentLobby,
    
    TournamentBracket: TournamentBracket,
    
    VerseMatch: VerseMatch,
    
    Shop: Shop,
    
    CreateTeam: CreateTeam,
    
    TeamHub: TeamHub,
    
    Minigames: Minigames,
    
    VerseJigsaw: VerseJigsaw,
    
    PictureMatch: PictureMatch,
    
    EmojiVerse: EmojiVerse,
    
    BibleBingo: BibleBingo,
    
    WiseWordle: WiseWordle,
    
    TriviaTower: TriviaTower,
    
    CaptureVerseLobby: CaptureVerseLobby,
    
    CaptureVerseGame: CaptureVerseGame,
    
    Settings: Settings,
    
    BibleReader: BibleReader,
    
    BibleChapter: BibleChapter,
    
    BibleFavorites: BibleFavorites,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Quiz" element={<Quiz />} />
                
                <Route path="/Badges" element={<Badges />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/BookSelection" element={<BookSelection />} />
                
                <Route path="/Leaderboard" element={<Leaderboard />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/DuelsLobby" element={<DuelsLobby />} />
                
                <Route path="/Duel" element={<Duel />} />
                
                <Route path="/DuelResults" element={<DuelResults />} />
                
                <Route path="/Friends" element={<Friends />} />
                
                <Route path="/TournamentLobby" element={<TournamentLobby />} />
                
                <Route path="/TournamentBracket" element={<TournamentBracket />} />
                
                <Route path="/VerseMatch" element={<VerseMatch />} />
                
                <Route path="/Shop" element={<Shop />} />
                
                <Route path="/CreateTeam" element={<CreateTeam />} />
                
                <Route path="/TeamHub" element={<TeamHub />} />
                
                <Route path="/Minigames" element={<Minigames />} />
                
                <Route path="/VerseJigsaw" element={<VerseJigsaw />} />
                
                <Route path="/PictureMatch" element={<PictureMatch />} />
                
                <Route path="/EmojiVerse" element={<EmojiVerse />} />
                
                <Route path="/BibleBingo" element={<BibleBingo />} />
                
                <Route path="/WiseWordle" element={<WiseWordle />} />
                
                <Route path="/TriviaTower" element={<TriviaTower />} />
                
                <Route path="/CaptureVerseLobby" element={<CaptureVerseLobby />} />
                
                <Route path="/CaptureVerseGame" element={<CaptureVerseGame />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/BibleReader" element={<BibleReader />} />
                
                <Route path="/BibleChapter" element={<BibleChapter />} />
                
                <Route path="/BibleFavorites" element={<BibleFavorites />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}