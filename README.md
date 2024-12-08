# D3 Baseball Dashboard

A comprehensive analytics platform designed specifically for NCAA Division III baseball, providing advanced statistics, scouting tools, and performance insights.

## Features

### Advanced Statistics
- Complete batting and pitching statistics for all D3 programs
- Advanced metrics including wOBA, wRC+, FIP, and WAR
- Park-adjusted statistics and league constants
- Historical data tracking from 2021-2024
- Custom filtering and export capabilities

### Game Charting
- Interactive pitch tracking and visualization
- Spray chart generation
- Bullpen session tracking
- Customizable pitch types and results
- CSV export functionality for further analysis

### Scouting Reports
- Team and player report generation
- Statistical integration with write-ups
- Position player and pitcher profiling
- PDF export functionality
- Collaborative editing capabilities

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Flask, SQLite
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Visualization**: D3.js
- **PDF Generation**: @react-pdf/renderer

## API Endpoints

### Statistics
- `GET /api/batting_war/<year>` - Batting statistics for specified year
- `GET /api/pitching_war/<year>` - Pitching statistics for specified year
- `GET /api/batting_team_war/<year>` - Team batting statistics
- `GET /api/pitching_team_war/<year>` - Team pitching statistics
- `GET /api/guts` - League constants
- `GET /api/park-factors` - Park factors
- `GET /api/run-expectancy` - Run expectancy
    
### Teams
- `GET /api/teams-2024` - All teams
- `GET /api/players-hit-2024/<team_id>` - Team hitting roster
- `GET /api/players-pitch-2024/<team_id>` - Team pitching roster

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- Baseball statistics courtesy of NCAA Division III institutions
- Park factors and league constants derived from historical data
- Built to support the D3 baseball community

## Support

For support, please open an issue in the GitHub repository or contact the maintainers directly.
