'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { METHOD_FIELDS, formatConversationMethod } from '@/lib/conversation-method';

function ConversationMethodReview({ draft, onApply, onBack }) {
  const { t } = useLanguage();
  const copy = t.conversationMethod;
  const [method, setMethod] = useState(draft.method);
  const [included, setIncluded] = useState({ corrections: true, example: false, notes: true });
  const [reviewed, setReviewed] = useState(false);

  return (
    <div className="space-y-5">
      <div className="space-y-2" aria-live="polite">
        <h3 className="text-lg font-semibold">{copy.reviewTitle}</h3>
        <p className="text-sm text-muted-foreground">{copy.reviewHint}</p>
        {draft.mode === 'manual' && <p className="text-sm text-amber-700">{copy.manualHint}</p>}
        {draft.truncated && <p className="text-sm text-amber-700">{copy.truncatedHint}</p>}
      </div>
      {METHOD_FIELDS.map((field) => (
        <div key={field} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`method-${field}`}>{copy.fields[field]}</Label>
            {Object.hasOwn(included, field) && (
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" aria-label={`${copy.include}: ${copy.fields[field]}`} checked={included[field]} onChange={(event) => {
                  setIncluded({ ...included, [field]: event.target.checked });
                  setReviewed(false);
                }} />
                {copy.include}
              </label>
            )}
          </div>
          <Textarea
            id={`method-${field}`}
            value={method[field]}
            maxLength={6000}
            disabled={included[field] === false}
            onChange={(event) => {
              setMethod({ ...method, [field]: event.target.value });
              setReviewed(false);
            }}
            className="min-h-24"
          />
        </div>
      ))}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />
        {copy.reviewConfirm}
      </label>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onBack}>{copy.back}</Button>
        <Button
          disabled={!reviewed || !method.goal.trim() || !method.steps.trim()}
          onClick={() => onApply({ ...draft, content: formatConversationMethod(method, draft.language, included) })}
        >{copy.continue}</Button>
      </div>
    </div>
  );
}

export { ConversationMethodReview };
