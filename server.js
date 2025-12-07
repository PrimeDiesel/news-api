const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// CACHE SYSTEM - Store articles in memory
const cache = {
  news: { data: null, timestamp: 0 },
  tech: { data: null, timestamp: 0 },
  sports: { data: null, timestamp: 0 },
  education: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes (1 hour) in milliseconds

function isCacheValid(cacheKey) {
  const cached = cache[cacheKey];
  if (!cached.data) return false;
  const age = Date.now() - cached.timestamp;
  return age < CACHE_DURATION;
}

function setCache(cacheKey, data) {
  cache[cacheKey] = {
    data: data,
    timestamp: Date.now()
  };
  console.log(`✅ Cached ${cacheKey} - ${data.length} articles`);
}

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the News API!');
});

// News route (existing)
app.get('/news', async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid('news')) {
      console.log('📦 Returning cached news');
      return res.json(cache.news.data);
    }
    
    console.log('🔄 Fetching fresh news from API...');
    // Fetch world news articles - request 20 to ensure we get 8+ after filtering
    const response = await axios.get('https://newsapi.org/v2/top-headlines?sources=bbc-news&pageSize=20&apiKey=59278959b90f45bbbfee3a42287dbf7b');
    
    // Expanded excluded words array to include more drug-related terms
    const excludedWords = [
      'murder', 'sexual assault', 'rape', 'drugs', 'drug trafficking', 'sex trafficking', 
      'cannabis', 'marijuana', 'illegal drugs', 'narcotics'
    ];
    
    const articles = response.data.articles
      .filter(article => 
        article.title &&
        !excludedWords.some(word => 
          article.title.toLowerCase().includes(word) || 
          (article.description && article.description.toLowerCase().includes(word))
        ) &&
        !article.source.name.includes('NFL') && 
        !article.source.name.includes('MLB')
      )
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: 'BBC News',
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }))
      .slice(0, 8);
    
    // Cache the results
    setCache('news', articles);
    
    // Return articles (should be 8)
    res.json(articles);
  } catch (error) {
    console.error('Error fetching news:', error.message);
    res.status(500).json({ 
      error: 'Error fetching news',
      message: error.message,
      articles: []
    });
  }
});

// Tech news route (NEW!)
app.get('/tech', async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid('tech')) {
      console.log('📦 Returning cached tech');
      return res.json(cache.tech.data);
    }
    
    console.log('🔄 Fetching fresh tech from API...');
    const response = await axios.get('https://newsapi.org/v2/top-headlines?category=technology&country=us&pageSize=8&apiKey=59278959b90f45bbbfee3a42287dbf7b');
    
    const excludedWords = [
      'murder', 'sexual assault', 'rape', 'drugs', 'drug trafficking', 'sex trafficking', 
      'cannabis', 'marijuana', 'illegal drugs', 'narcotics'
    ];
    
    const articles = response.data.articles
      .filter(article => 
        article.title &&
        !excludedWords.some(word => 
          article.title.toLowerCase().includes(word) || 
          (article.description && article.description.toLowerCase().includes(word))
        )
      )
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }))
      .slice(0, 8);
    
    // Cache the results
    setCache('tech', articles);
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching tech news:', error.message);
    res.status(500).json({
      error: 'Error fetching tech news',
      message: error.message,
      articles: []
    });
  }
});

// Sports news route (NEW!)
app.get('/sports', async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid('sports')) {
      console.log('📦 Returning cached sports');
      return res.json(cache.sports.data);
    }
    
    console.log('🔄 Fetching fresh sports from API...');
    const response = await axios.get('https://newsapi.org/v2/top-headlines?category=sports&country=gb&pageSize=8&apiKey=59278959b90f45bbbfee3a42287dbf7b');
    
    // Less strict filtering for sports - only exclude extreme content
    const excludedWords = [
      'murder', 'sexual assault', 'rape', 'sex trafficking'
    ];
    
    const articles = response.data.articles
      .filter(article => 
        article.title &&
        !excludedWords.some(word => 
          article.title.toLowerCase().includes(word) || 
          (article.description && article.description.toLowerCase().includes(word))
        )
      )
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }))
      .slice(0, 8);
    
    // Cache the results
    setCache('sports', articles);
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching sports news:', error.message);
    res.status(500).json({
      error: 'Error fetching sports news', 
      message: error.message,
      articles: []
    });
  }
});

// Education news route - UK-wide education (NEW!)
app.get('/education', async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid('education')) {
      console.log('📦 Returning cached education');
      return res.json(cache.education.data);
    }
    
    console.log('🔄 Fetching fresh education from API...');
    console.log('Education: Fetching UK education articles...');
    
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: 'UK education school pupils students',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 100,
        apiKey: '59278959b90f45bbbfee3a42287dbf7b'
      }
    });
    
    console.log('Education: Got', response.data.articles.length, 'articles from API');
    
    // STRICT filtering - MUST contain education keywords
    const educationKeywords = [
      'education', 'school', 'university', 'college', 'pupils', 'students', 
      'teachers', 'sqa', 'exam', 'gcse', 'a-level', 'higher', 'national 5', 
      'curriculum', 'learning', 'ofsted', 'academy', 'headteacher', 'classroom',
      'educational', 'teaching', 'tuition', 'scholarship'
    ];
    
    const sportKeywords = [
      'world cup', 'premier league', 'champions league', 'football', 'rugby', 
      'cricket', 'match', 'goal', 'uefa', 'fifa', 'tournament', 'championship',
      'striker', 'midfielder', 'defender', 'goalkeeper', 'scored', 'defeat', 'victory'
    ];
    
    const articles = response.data.articles
      .filter(article => {
        if (!article.title || !article.description) return false;
        
        const combined = (article.title + ' ' + article.description).toLowerCase();
        
        // Must NOT contain any sports keywords
        const hasSports = sportKeywords.some(word => combined.includes(word));
        if (hasSports) return false;
        
        // MUST contain at least ONE education keyword
        const hasEducation = educationKeywords.some(word => combined.includes(word));
        return hasEducation;
      })
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }))
      .slice(0, 8);
    
    // Cache the results
    setCache('education', articles);
    
    console.log(`Education: Returning ${articles.length} UK education articles`);
    res.json(articles);
  } catch (error) {
    console.error('Education ERROR:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.data);
    }
    res.status(500).json({ 
      error: 'Error fetching education news',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
