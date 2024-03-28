import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { ElectionStateEnum } from '../utils/enums';
import CreateElection from '../components/CreateElection';
import Candidate from '../components/CandidateCard';

export default function Admin({ contract, web3, currentAccount }) {
	const [electionState, setElectionState] = useState(0);
	const [candidates, setCandidates] = useState([]);
	const [loading, setLoading] = useState(false);

	const getCandidates = async () => {
		if (contract) {
			const count = await contract.methods.candidatesCount().call();
			const temp = [];
			for (let i = 0; i < count; i++) {
				const candidate = await contract.methods
					.getCandidateDetails(i)
					.call();
				temp.push({ name: candidate[0], votes: candidate[1] });
			}
			setCandidates(temp);
			setLoading(false);
		}
	};

	const getElectionState = async () => {
		if (contract) {
			const state = await contract.methods.electionState().call();
			setElectionState(parseInt(state));
		}
		setLoading(false);
	};

	const handleEnd = async () => {
		try {
			if (contract) {
				await contract.methods
					.endElection()
					.send({ from: currentAccount });
				getElectionState();
			}
		} catch (error) {
			console.error('Error:', error);
		}
	};

	useEffect(() => {
		getCandidates();
		getElectionState();
		const candidateAddedListener = contract.events
			.CandidateAdded()
			.on('data', (event) => {
				getCandidates();
			});

		const stateChangedListener = contract.events
			.ElectionStateChanged()
			.on('data', (event) => {
				getElectionState();
			});

		return () => {
			candidateAddedListener.unsubscribe();
			stateChangedListener.unsubscribe();
		};
	}, [contract]);

	return (
		<Box>
			{loading ? (
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						height: '80vh',
					}}
				>
					Loading...
				</Box>
			) : (
				<Box>
					{electionState !== ElectionStateEnum.NOT_STARTED && (
						<Grid container sx={{ mt: 0 }} spacing={4}>
							<Grid item xs={12}>
								<Typography
									align="center"
									variant="h6"
									color="textSecondary"
								>
									ELECTION STATUS :{' '}
									{electionState ===
										ElectionStateEnum.IN_PROGRESS &&
										'Election is in progress.'}
									{electionState ===
										ElectionStateEnum.ENDED &&
										'Election has ended.'}
								</Typography>
								<Divider />
							</Grid>
							<Grid item xs={12} align="center">
								{electionState ===
									ElectionStateEnum.IN_PROGRESS && (
									<Button
										variant="contained"
										sx={{ width: '30%', margin: 'auto' }}
										onClick={handleEnd}
									>
										End election
									</Button>
								)}
							</Grid>

							<Grid item xs={12}>
								<Typography align="center" variant="h6">
									{electionState === 1 && 'LIVE RESULTS'}
									{electionState === 2 && 'FINAL RESULT'}
								</Typography>
								<Divider />
							</Grid>
							<Box
								sx={{
									overflowY: 'hidden',
									overflowX: 'auto',
									display: 'flex',
									width: '100%',
									justifyContent: 'center',
									marginTop: 4,
								}}
							>
								{candidates.map((candidate, index) => (
									<Box sx={{ mx: 2 }} key={index}>
										<Candidate
											id={index}
											name={candidate.name}
											voteCount={candidate.votes}
										/>
									</Box>
								))}
							</Box>
						</Grid>
					)}

					{electionState === ElectionStateEnum.NOT_STARTED && (
						<CreateElection
							contract={contract}
							web3={web3}
							currentAccount={currentAccount}
						/>
					)}
				</Box>
			)}
		</Box>
	);
}
