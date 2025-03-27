1. Add login when connecting to Notion
2. Alignment issue for 2 switches
3. Show db if it is already selected
4. Fix overflow issue when fields are loaded
5. Fix issue with redirect url. Option to have multiple redirect urls in Notion
6. Create component for each field type and use them
7. Handle security of env props and nuxt config for client & server
8. Handle RLS issue in Supabase


# Notion Integration Improvements

## Database Persistence and Search Optimization

### Completed Tasks
- [x] Store selected database in localStorage to persist across page refreshes
- [x] Add a refresh button next to the search box to manually fetch databases from Notion
- [x] Ensure notion fields are properly stored and used in the notion_data store

### Pending Tasks
- [ ] Optimize database search to search locally in Pinia store instead of calling Notion API
- [ ] Implement a better solution for fetching all databases the user has given permission for
  - Currently, Notion API doesn't provide a direct way to get all databases a user has access to
  - Consider implementing pagination or a recursive search approach
- [ ] Add a caching mechanism for database schemas to reduce API calls
- [ ] Implement error handling for cases where the saved database ID is no longer accessible

### Technical Notes
1. **Search Optimization**:
   - When user types in search box, first search through the databases array in the notion_data store
   - Only call the Notion API when the refresh button is clicked
   - This reduces API calls and improves performance

2. **Database Access Challenge**:
   - Notion API limitation: No direct endpoint to get all databases a user has access to
   - Potential solutions:
     - Use search endpoint with empty query and pagination to get as many databases as possible
     - Store previously accessed databases in localStorage as a "history"
     - Implement a "favorites" feature for users to mark important databases

3. **Caching Strategy**:
   - Cache database schemas in localStorage with a TTL (time-to-live)
   - Invalidate cache when refresh button is clicked
   - Add a visual indicator when using cached data vs. fresh data
