import { useCallback } from 'react';
import { useStudioStore } from './useStudioStore';

// Hook for managing isolated worktrees.
export const useWorktree = () => {
  const { 
    yDoc, 
    yImage, 
    yAudio, 
    yExperimental, 
    yReviewMode, 
    sendMessage 
  } = useStudioStore();

  const isReviewMode = yReviewMode.get('active') as boolean;

  const startReview = useCallback((proposalId: string) => {
    yDoc.transact(() => {
      yReviewMode.set('active', true);
      yExperimental.set('activeProposalId', proposalId);
    });
  }, [yDoc, yReviewMode, yExperimental]);

  const endReview = useCallback(() => {
    yDoc.transact(() => {
      yReviewMode.set('active', false);
      yExperimental.set('activeProposalId', null);
    });
  }, [yDoc, yReviewMode, yExperimental]);

  const commitProposal = useCallback((proposalId: string) => {
    const proposals = yExperimental.get('proposals') as any;
    const proposal = proposals.get(proposalId);
    
    if (!proposal) return;

    yDoc.transact(() => {
      if (proposal.type === 'image_inpaint' || proposal.type === 'image_generate') {
        yImage.set('baseImageData', proposal.data);
      } else if (proposal.type === 'audio_layer') {
        const layers = [...(yAudio.get('layers') as any[])];
        const layerIdx = layers.findIndex(l => l.name === proposal.layerName);
        if (layerIdx !== -1) {
          layers[layerIdx] = { ...layers[layerIdx], lastResultUrl: proposal.data };
          yAudio.set('layers', layers);
        }
      }
      
      // Cleanup
      proposals.delete(proposalId);
      endReview();
    });

    sendMessage({
      type: 'commit_proposal',
      proposal_id: proposalId
    });
  }, [yDoc, yImage, yAudio, yExperimental, endReview, sendMessage]);

  const discardProposal = useCallback((proposalId: string) => {
    const proposals = yExperimental.get('proposals') as any;
    
    yDoc.transact(() => {
      proposals.delete(proposalId);
      endReview();
    });

    sendMessage({
      type: 'discard_proposal',
      proposal_id: proposalId
    });
  }, [yDoc, yExperimental, endReview, sendMessage]);

  return {
    isReviewMode,
    activeProposalId: yExperimental.get('activeProposalId'),
    proposals: yExperimental.get('proposals'),
    startReview,
    endReview,
    commitProposal,
    discardProposal
  };
};
