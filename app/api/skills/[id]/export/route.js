import { getCatalogSkill } from '@/lib/skills-catalog';
import { canRedistributeSkill, parseSkillFrontmatter } from '@/lib/skills-sync';
import { createSkillArchive } from '@/lib/skill-export';
import { assert } from '@/lib/api-error';
import { handleApiError } from '@/lib/handle-api-error';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const skill = await getCatalogSkill(id);
    assert(skill, 404, 'Skill not found.');
    assert(skill.content && canRedistributeSkill(skill), 403, 'This Skill is not available for export.');
    const { name } = parseSkillFrontmatter(skill.content);
    const files = [...skill.files];
    const mainFile = files.find((file) => file.path === 'SKILL.md');
    if (mainFile) {
      assert(mainFile.contents === skill.content, 409, 'The stored Skill files are inconsistent. Sync the source again.');
    } else {
      files.unshift({ path: 'SKILL.md', contents: skill.content });
    }
    const metadataFile = {
      path: 'promptminder-source.json',
      contents: JSON.stringify({
        source: skill.source,
        url: skill.installUrl,
        license: skill.licenseSpdx,
        licenseUrl: skill.licenseUrl,
        contentHash: skill.contentHash,
        syncedAt: skill.syncedAt,
        scope: 'Stored text-file snapshot; may not include all upstream files or binary assets.',
      }, null, 2),
    };
    return new Response(createSkillArchive({ name, files, metadataFile }), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${name}.zip"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleApiError(error, 'Unable to export Skill.');
  }
}
