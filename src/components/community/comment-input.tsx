// src/components/community/comment-input.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { searchUsers } from '@/lib/community';
import type { AppUser, Mention } from '@/types';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserCircle, Send } from 'lucide-react';

const commentSchema = z.object({
  text: z.string().min(1, 'El comentario no puede estar vacío.').max(500, 'El comentario no puede exceder los 500 caracteres.'),
});

type UserSuggestion = { id: string; name: string; photoURL: string | null };

interface CommentInputProps {
    user: NonNullable<AppUser>;
    onSubmit: (text: string, mentions: Mention[]) => Promise<void>;
    placeholder: string;
    autoFocus?: boolean;
}

export function CommentInput({ user, onSubmit, placeholder, autoFocus = false }: CommentInputProps) {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentions, setMentions] = useState<Map<string, string>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: '' },
  });

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (mentionQuery) {
        const results = await searchUsers(mentionQuery);
        setSuggestions(results);
        if (results.length > 0) {
            setShowSuggestions(true);
        }
      }
    }, 300); // Debounce

    return () => clearTimeout(handler);
  }, [mentionQuery]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    form.setValue('text', text);

    const cursorPos = e.target.selectionStart;
    const textUpToCursor = text.substring(0, cursorPos);
    const mentionMatch = textUpToCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
    } else {
      setShowSuggestions(false);
      setMentionQuery('');
    }
  };

  const handleSelectSuggestion = (suggestion: UserSuggestion) => {
    const currentText = form.getValues('text');
    const cursorPos = textareaRef.current?.selectionStart ?? currentText.length;
    const textUpToCursor = currentText.substring(0, cursorPos);
    
    // Replace the partial @mention with the full one
    const newText = textUpToCursor.replace(/@(\w*)$/, `@${suggestion.name} `) + currentText.substring(cursorPos);
    
    form.setValue('text', newText);

    // Store the mention
    setMentions(prev => new Map(prev).set(`@${suggestion.name}`, suggestion.id));

    setShowSuggestions(false);
    setMentionQuery('');
    textareaRef.current?.focus();
  };

  const handleFormSubmit = async (values: z.infer<typeof commentSchema>) => {
    setIsSubmitting(true);
    const finalMentions: Mention[] = [];
    mentions.forEach((userId, displayName) => {
        if (values.text.includes(displayName)) {
            finalMentions.push({ displayName: displayName.substring(1), userId });
        }
    });

    await onSubmit(values.text, finalMentions);
    
    form.reset();
    setMentions(new Map());
    setIsSubmitting(false);
  };

  return (
    <Card className="shadow-none border-0">
      <CardContent className="p-0">
        <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 mt-1">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback><UserCircle /></AvatarFallback>
                  </Avatar>
                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <Textarea
                            {...field}
                            ref={textareaRef}
                            placeholder={placeholder}
                            onChange={handleTextChange}
                            autoFocus={autoFocus}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSubmitting} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-1" align="start">
             {suggestions.length > 0 ? (
                suggestions.map(s => (
                    <Button
                        key={s.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-2"
                        onClick={() => handleSelectSuggestion(s)}
                    >
                         <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={s.photoURL || undefined} />
                            <AvatarFallback><UserCircle /></AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{s.name}</span>
                    </Button>
                ))
             ) : (
                <div className="p-2 text-sm text-muted-foreground">No se encontraron usuarios.</div>
             )}
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
