import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.FORNTEND_URL,
      "https://relyzers.shop",
    ], // Only allow frontend
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    credentials: true, // If using cookies/auth tokens
  })
);
app.use(express.json());

// Token storage
let accessToken = null;
let refreshToken = null;
let accessTokenExpiry = null;
let refreshTokenExpiry = null;

// Cache for storing jobs
let cachedJobs = [];
let totalJobCount = 313; // Default based on API response
let cacheTimestamp = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache (increased from 15 minutes)
let totalPages = 16; // Default based on API response, will be updated dynamically

// Function to get new tokens
async function getAuthTokens() {
  try {
    console.log("Getting new auth tokens from CEIPAL...");
    const response = await axios.post(
      "https://api.ceipal.com/v1/createAuthtoken",
      {
        email: process.env.CEIPAL_EMAIL,
        password: process.env.CEIPAL_PASSWORD,
        api_key: process.env.CEIPAL_API_KEY,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.access_token) {
      accessToken = response.data.access_token;
      refreshToken = response.data.refresh_token;
      console.log(
        "new auth token are: ",
        accessToken,
        "\n",
        "refreshToken: ",
        refreshToken
      );
      // Set token expiry times according to documentation
      accessTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      refreshTokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      return accessToken;
    } else {
      console.error("Unexpected response structure:");
      throw new Error("Failed to get access_token from response");
    }
  } catch (error) {
    console.error("Error getting CEIPAL auth tokens:", error.message);
    if (error.response) {
      console.error("Response status:error");
      console.error("Response data:error");
    }
    throw error;
  }
}

// Function to refresh the access token using the refresh token
async function refreshAccessToken() {
  try {
    // According to documentation, send the access token in the headers as Token
    const response = await axios.post(
      "https://api.ceipal.com/v1/refreshToken",
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Token: accessToken,
        },
      }
    );

    if (response.data && response.data.access_token) {
      accessToken = response.data.access_token;
      accessTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      return accessToken;
    } else {
      throw new Error("Failed to refresh access token");
    }
  } catch (error) {
    console.error("Error refreshing access token:", error.message);
    if (error.response) {
      console.error("Response status:");
      console.error("Response data:");
    }

    // If refresh fails and refresh token is still valid, try getting new tokens
    if (Date.now() < refreshTokenExpiry) {
      return getAuthTokens();
    } else {
      throw new Error("Refresh token expired. Please authenticate again.");
    }
  }
}

// Middleware to ensure we have a valid token
async function ensureToken(req, res, next) {
  console.log("checking token");
  try {
    // If we don't have tokens yet, get new ones
    if (!accessToken || !refreshToken) {
      console.log(
        "oh user don't have accestoke and refresh token token. now trying to get new one"
      );
      await getAuthTokens();
    }
    // If access token is expired but refresh token is still valid
    else if (
      Date.now() > accessTokenExpiry &&
      Date.now() < refreshTokenExpiry
    ) {
      console.log("user have refreshtoken now trying to  refresh it");
      await refreshAccessToken();
    }
    // If both tokens are expired, get new ones
    else if (Date.now() > refreshTokenExpiry) {
      console.log("bothe token are expired now trying to get new one");
      await getAuthTokens();
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    res.status(500).json({ error: "Failed to authenticate with CEIPAL API" });
  }
}

// Function to fetch all jobs and update cache
async function fetchAllJobsAndUpdateCache() {
  console.log("Fetching all jobs and updating cache...");
  let allJobs = [];

  try {
    // First, get the first page to determine total pages
    const firstPageEndpoint = `https://api.ceipal.com/getCustomJobPostingDetails/Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09/ee4a96a9e2f7a822b0bb8ebb89b1c18c/?page=1`;
    const firstPageResponse = await axios.get(firstPageEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (firstPageResponse.data && firstPageResponse.data.num_pages) {
      totalPages = firstPageResponse.data.num_pages;
    }

    if (firstPageResponse.data && firstPageResponse.data.count) {
      totalJobCount = firstPageResponse.data.count;
    }

    // Add first page results to allJobs
    if (firstPageResponse.data && firstPageResponse.data.results) {
      allJobs = [...firstPageResponse.data.results];
    }

    // Create an array of promises for pages 2 to totalPages
    const pagePromises = [];
    for (let page = 2; page <= totalPages; page++) {
      const endpoint = `https://api.ceipal.com/getCustomJobPostingDetails/Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09/ee4a96a9e2f7a822b0bb8ebb89b1c18c/?page=${page}`;
      pagePromises.push(
        axios
          .get(endpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          })
          .catch((error) => {
            console.error(`Error fetching page ${page}:`, error.message);
            return { data: { results: [] } }; // Return empty results on error
          })
      );
    }

    // Execute all promises in parallel
    const pageResponses = await Promise.all(pagePromises);

    // Combine all results
    pageResponses.forEach((response) => {
      if (response.data && response.data.results) {
        allJobs = [...allJobs, ...response.data.results];
      }
    });

    // Sort jobs by Created date (newest first)
    allJobs.sort((a, b) => {
      // Use the Created field from the API response
      if (a.Created && b.Created) {
        return new Date(b.Created).getTime() - new Date(a.Created).getTime();
      }
      return 0;
    });

    // Update cache
    cachedJobs = allJobs;
    cacheTimestamp = Date.now();
    console.log(
      `Cached ${allJobs.length} jobs from ${totalPages} pages, sorted by creation date (newest first)`
    );

    return allJobs;
  } catch (error) {
    console.error("Error fetching all jobs:", error.message);
    throw error;
  }
}

// Route to get jobs from CEIPAL
app.get("/api/jobs", ensureToken, async (req, res) => {
  try {
    const page = req.query.page ? Number.parseInt(req.query.page) : 1;
    const limit = 20; // Items per page

    // Check if we need to refresh the cache
    const isCacheValid =
      cachedJobs.length > 0 &&
      cacheTimestamp &&
      Date.now() - cacheTimestamp < CACHE_DURATION;

    let allJobs = [];

    if (isCacheValid) {
      console.log("Using cached jobs data");
      allJobs = cachedJobs;
    } else {
      console.log("Cache invalid or empty, fetching all jobs");
      try {
        allJobs = await fetchAllJobsAndUpdateCache();
      } catch (error) {
        console.error("Error fetching all jobs:", error.message);

        // If fetching all jobs fails, try to get at least the requested page
        const endpoint = `https://api.ceipal.com/getCustomJobPostingDetails/Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09/ee4a96a9e2f7a822b0bb8ebb89b1c18c/?page=${page}`;
        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.data && response.data.results) {
          // Return the single page result with a warning
          console.log("Falling back to single page result");
          return res.json({
            ...response.data,
            warning:
              "Could not fetch all jobs. Results may not be sorted correctly.",
          });
        } else {
          throw error; // Re-throw if we couldn't get any results
        }
      }
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedJobs = allJobs.slice(startIndex, endIndex);
    const totalPages = Math.ceil(allJobs.length / limit);

    // Construct response object similar to the API response
    const response = {
      count: allJobs.length,
      num_pages: totalPages,
      limit: limit,
      page_number: page,
      page_count: paginatedJobs.length,
      next:
        page < totalPages
          ? `${req.protocol}://${req.get("host")}/api/jobs?page=${page + 1}`
          : null,
      previous:
        page > 1
          ? `${req.protocol}://${req.get("host")}/api/jobs?page=${page - 1}`
          : null,
      results: paginatedJobs,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching jobs from CEIPAL:", error.message);
    if (error.response) {
      console.error("Response status:");
      console.error("Response data:");
    }

    // If there's an authentication error, try to get new tokens and retry
    if (error.response && error.response.status === 401) {
      try {
        console.log("Authentication error. Getting new tokens and retrying...");
        await getAuthTokens();
        return res.redirect("/api/jobs");
      } catch (authError) {
        console.error("Failed to refresh authentication:", authError.message);
      }
    }

    // Return an empty array or error message
    res.status(500).json({
      error: "Failed to fetch jobs from CEIPAL API",
      message: error.message,
    });
  }
});

// Optimized search endpoint with parallel API calls
app.get("/api/searchjobs", ensureToken, async (req, res) => {
  try {
    const { query, location } = req.query;
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : 100; // Default limit to 100 results

    // If no search parameters, return the first page of jobs
    if (!query && !location) {
      return res.redirect("/api/jobs");
    }

    // Check if we have a valid cache
    const isCacheValid =
      cachedJobs.length > 0 &&
      cacheTimestamp &&
      Date.now() - cacheTimestamp < CACHE_DURATION;

    let allJobs = [];

    // Use cache if valid, otherwise fetch jobs
    if (isCacheValid) {
      console.log("Using cached jobs data for search");
      allJobs = cachedJobs;
    } else {
      console.log("Cache invalid or empty, fetching all jobs for search");
      try {
        allJobs = await fetchAllJobsAndUpdateCache();
      } catch (error) {
        console.error("Error fetching all jobs for search:", error.message);
        // If fetching all jobs fails, try to get at least some results
        const firstPageEndpoint = `https://api.ceipal.com/getCustomJobPostingDetails/Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09/ee4a96a9e2f7a822b0bb8ebb89b1c18c/?page=1`;
        const firstPageResponse = await axios.get(firstPageEndpoint, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (firstPageResponse.data && firstPageResponse.data.results) {
          allJobs = firstPageResponse.data.results;
          console.log("Falling back to first page results only");

          // Sort by Created date (newest first)
          allJobs.sort((a, b) => {
            if (a.Created && b.Created) {
              return (
                new Date(b.Created).getTime() - new Date(a.Created).getTime()
              );
            }
            return 0;
          });
        }
      }
    }

    // Optimize filtering with early returns and efficient checks
    let filteredJobs = allJobs;

    if (query) {
      const searchTerm = query.toLowerCase();
      filteredJobs = filteredJobs.filter((job) => {
        // Check most common fields first for better performance
        if (job.job_title?.toLowerCase().includes(searchTerm)) return true;
        if (job.client?.toLowerCase().includes(searchTerm)) return true;
        if (job.skills?.toLowerCase().includes(searchTerm)) return true;
        return false;
      });
    }

    if (location) {
      const locationTerm = location.toLowerCase();
      filteredJobs = filteredJobs.filter((job) => {
        if (job.city?.toLowerCase().includes(locationTerm)) return true;
        if (job.country?.toLowerCase().includes(locationTerm)) return true;
        if (job.zip_code?.toString().includes(locationTerm)) return true;
        return false;
      });
    }

    // Limit results for faster response
    const limitedResults = filteredJobs.slice(0, limit);

    // Return the filtered jobs with pagination info and total count
    res.json({
      count: filteredJobs.length,
      total_count: totalJobCount, // Include total count for reference
      results: limitedResults,
      next: limitedResults.length < filteredJobs.length ? true : null,
      previous: null,
      num_pages: Math.ceil(filteredJobs.length / 20), // Add num_pages for pagination
      page_number: 1,
    });
  } catch (error) {
    console.error("Error searching jobs from CEIPAL:", error.message);
    if (error.response) {
      console.error("Response status:");
      console.error("Response data:");
    }

    // If there's an authentication error, try to get new tokens and retry
    if (error.response && error.response.status === 401) {
      try {
        console.log("Authentication error. Getting new tokens and retrying...");
        await getAuthTokens();
        return res.redirect(
          "/api/searchjobs" + req.url.substring(req.url.indexOf("?"))
        );
      } catch (authError) {
        console.error("Failed to refresh authentication:", authError.message);
      }
    }

    // Return an empty array or error message
    res.status(500).json({
      error: "Failed to search jobs from CEIPAL API",
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Get all jobs at http://localhost:${PORT}/api/jobs`);
});
