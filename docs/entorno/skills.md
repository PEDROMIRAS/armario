# Skills de Claude Code

Las skills personales viven en cada PC (`~/.claude/skills/`) y no se sincronizan. Para tener las
mismas en otro ordenador, hay que instalarlas con estos comandos. Hacen falta Node (`npx`), y
`uv` para graphify.

```bash
# find-skills
npx skills add vercel-labs/skills --skill find-skills -g -a claude-code -y

# ponytail (ponytail, -review, -audit, -debt, -gain, -help)
npx skills add DietrichGebert/ponytail -g -a claude-code -y

# graphify (crea la skill /graphify y añade unas líneas a ~/.claude/CLAUDE.md)
brew install uv
uv tool install graphifyy && graphify install
uv tool update-shell   # pone ~/.local/bin en el PATH

# agent-loom (dvy1987) primero, porque algunos nombres coinciden con los de addyosmani
npx skills add dvy1987/agent-loom -g -a claude-code -y

# addyosmani/agent-skills después: así sus 12 skills con el mismo nombre quedan por encima
npx skills add addyosmani/agent-skills -g -a claude-code -y
```

Orden importante: agent-loom y agent-skills comparten 12 nombres, y gana el último que se instala.
Se usan las de addyosmani para `api-and-interface-design`, `browser-testing-with-devtools`,
`ci-cd-and-automation`, `code-simplification`, `context-engineering`,
`git-workflow-and-versioning`, `incremental-implementation`, `performance-optimization`,
`shipping-and-launch`, `source-driven-development`, `spec-driven-development` y
`test-driven-development`.

Las skills de la cuenta de claude.ai (pdf, docx, skill-creator…) se sincronizan solas.

Las skills del proyecto van en el repositorio, en `.claude/skills/`, y llegan a cada PC con
`git pull`. Hoy solo hay una: `caveman-compress`, que comprime archivos como `CLAUDE.md` para
gastar menos tokens. Envía el texto del archivo a Claude. `skills-lock.json` guarda de dónde sale
cada una (`npx skills add <repo> --skill <nombre> -a claude-code`).

## Otras notas

- `graphify-out/` está en `.gitignore`. En cada PC se regenera con `/graphify .`.
- Con más de 140 skills, Claude Code deja de ver la descripción de muchas y no las activa solas.
  Se pueden invocar a mano con `/nombre`. Conviene quitar las que no se usen con
  `npx skills remove <nombre> -g`.
