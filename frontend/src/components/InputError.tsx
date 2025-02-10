const InputError = ({ errorMessage }: { errorMessage: string | undefined }) => {
  return (
    <p className="text-custom-red text-[12px] text-sm font-normal tracking-wide">
      {errorMessage}
    </p>
  );
};

export default InputError;
