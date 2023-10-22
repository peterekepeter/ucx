Compile fails at line 5 because of the opening bracket

	for ( j = 0; j < TeamCount; j += 1 ) 
	{
		{
			if ( PlayersInTeam[smallest] + BotsInTeam[smallest] > PlayersInTeam[j] + BotsInTeam[j] )
			{
				smallest = j;
			}
		}
	}
