import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function usePromptDetail(id) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(null);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [variableValues, setVariableValues] = useState({});
  const [hasVariables, setHasVariables] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      fetch(`/api/prompts/${id}`)
        .then((response) => response.json())
        .then((data) => {
          setPrompt({...data, tags: data.tags ? data.tags.split(',') : []});
          setSelectedVersion(data.version);
          
          // Fetch versions
          fetch(`/api/prompts?title=${encodeURIComponent(data.title)}`)
            .then((response) => response.json())
            .then((versionsData) => {
              // API returns { prompts: [], pagination: {} }
              const promptsList = versionsData.prompts || [];
              const sameTitle = promptsList.filter(v => v.title === data.title);
              setVersions(sameTitle.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            })
            .catch((error) => console.error('Error fetching versions:', error))
            .finally(() => setIsLoading(false));
        })
        .catch((error) => {
          console.error('Error fetching prompt:', error);
          setIsLoading(false);
        });
    }
  }, [id]);

  const handleVersionChange = (version) => {
    const selectedPrompt = versions.find(v => v.version === version);
    if (selectedPrompt) {
      router.push(`/prompts/${selectedPrompt.id}`);
    }
  };

  const handleVariablesChange = (values, hasVars) => {
    setVariableValues(values);
    setHasVariables(hasVars);
  };

  const updatePrompt = (updatedPrompt) => {
    setPrompt(updatedPrompt);
  };

  return {
    prompt,
    versions,
    selectedVersion,
    variableValues,
    hasVariables,
    isLoading,
    handleVersionChange,
    handleVariablesChange,
    updatePrompt
  };
}