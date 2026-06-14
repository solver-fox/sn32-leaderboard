export function ThemeScript() {
  const script = `(function(){try{var r=localStorage.getItem('sn32-theme');var t=r?JSON.parse(r).state.theme:'dark';document.documentElement.classList.toggle('dark',t!=='light');}catch(e){document.documentElement.classList.add('dark');}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
