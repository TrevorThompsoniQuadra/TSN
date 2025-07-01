import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, X, ThumbsUp, Calendar, User, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Article, Comment } from "@shared/schema";

interface ArticleModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArticleModal({ article, isOpen, onClose }: ArticleModalProps) {
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(0);
  const [currentViews, setCurrentViews] = useState(0);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const queryClient = useQueryClient();

  // Initialize engagement data when article changes
  useEffect(() => {
    if (article) {
      setCurrentLikes(article.likes || 0);
      setCurrentViews(article.views || 0);
      setIsLiked(false);
      setHasTrackedView(false);
    }
  }, [article?.id]);

  // Fetch comments for this article
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['/api/articles', article?.id, 'comments'],
    enabled: !!article?.id && isOpen,
  });

  // Like article mutation
  const likeMutation = useMutation({
    mutationFn: () => apiRequest(`/api/articles/${article?.id}/like`, 'POST'),
    onSuccess: () => {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setCurrentLikes(prev => newLikedState ? prev + 1 : prev - 1);
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/news/breaking'] });
      toast({
        title: newLikedState ? "Article liked!" : "Like removed",
        description: newLikedState ? "Thanks for liking this article" : "You unliked this article",
      });
    },
  });

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest(`/api/articles/${article?.id}/comments`, 'POST', {
        content,
        userId: 1, // Default user since auth is disabled
        articleId: article?.id,
      }),
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ['/api/articles', article?.id, 'comments'] });
      toast({
        title: "Comment added!",
        description: "Your comment has been posted successfully",
      });
    },
  });

  // View tracking mutation
  const viewMutation = useMutation({
    mutationFn: () => apiRequest(`/api/articles/${article?.id}/view`, 'POST'),
    onSuccess: () => {
      setCurrentViews(prev => prev + 1);
      setHasTrackedView(true);
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/news/breaking'] });
    },
  });

  // Track view when modal opens (only once per article)
  useEffect(() => {
    if (article && isOpen && !hasTrackedView) {
      viewMutation.mutate();
    }
  }, [article?.id, isOpen, hasTrackedView]);

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleComment = () => {
    if (newComment.trim()) {
      commentMutation.mutate(newComment.trim());
    }
  };

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary || article.title,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Article link copied to clipboard",
    });
  };

  
  if (!article) return null;

  // Extract link and cleaned content from article content
const extractContentAndLink = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = content.match(urlRegex);
    const link = match ? match[0] : null;
  
    // Remove link from content if found
    const cleaned = link ? content.replace(link, "").trim() : content;
  
    return { cleanedContent: cleaned, link };
  };
  
  const { cleanedContent, link } = extractContentAndLink(article.content || "");

  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold leading-tight pr-8">
            {article.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Article Meta Info */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
              </div>
              <Badge variant="secondary">{article.category}</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span>{currentViews} views</span>
              <span>{currentLikes} likes</span>
            </div>
          </div>

          {/* Article Image */}
          {article.imageUrl && (
            <div className="relative w-full h-64 overflow-hidden rounded-lg">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}


          {/* Article Content */}
          <div className="prose dark:prose-invert max-w-none space-y-4">
  <p className="text-lg leading-relaxed whitespace-pre-wrap">{cleanedContent}</p>

  {link && (
    <p className="text-sm">
      Read more at:{" "}
      <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
        {link}
      </a>
    </p>
  )}
</div>


          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Source Link (for NewsAPI articles) */}
          {(article as any).url && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Source: {article.source}
              </span>
              <span></span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open((article as any).url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Read Full Article
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-b py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                disabled={likeMutation.isPending}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'} ({currentLikes})
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <ThumbsUp className="h-4 w-4 mr-1" />
              {currentViews} views
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">
                Comments ({comments.length})
              </h3>
            </div>

            {/* Add Comment */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Share your thoughts about this article..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleComment}
                      disabled={!newComment.trim() || commentMutation.isPending}
                      size="sm"
                    >
                      {commentMutation.isPending ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comment.userId?.toString().charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">User {comment.userId || 'Anonymous'}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}