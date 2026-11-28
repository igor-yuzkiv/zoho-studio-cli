# `zoho-studio instructions`

Друкує інструкції для ШІ-агента, що працює в проєкті zoho-studio, у форматі markdown: що таке
проєкт, з чого почати, які команди пишуть у Zoho, чого CLI не вміє і для чого кожна команда.

```bash
zoho-studio instructions                       # the project, where to start, what the CLI does not do, every command
zoho-studio instructions z-crm                 # everything about Zoho CRM and its commands
zoho-studio instructions z-crm:functions       # one group: its commands and the usual order
zoho-studio instructions z-crm:functions:pull  # one command
```

Назва повторює назви команд: будь-яка команда або будь-який її префікс до `:` — `z-crm`,
`z-crm:functions`, `z-crm:fields`. Група перелічує свої команди з однорядковим описом. Текст команди
каже, для чого вона, коли її використовувати, чи пише вона в Zoho, чи потрібні логін або
інтерактивний термінал, і що вона змінює на диску; опції лишаються в `zoho-studio <command> --help`.

Працює будь-де, у проєкті чи поза ним, і нічого не надсилає в Zoho.

Невідома назва завершується з кодом виходу 1 і підказує найближчі назви:

```text
There is no command or group named "z-crm:function". Did you mean: z-crm:functions, …?
```

Тексти вбудовані у виконуваний файл, тож завжди відповідають версії CLI, яка їх друкує.
